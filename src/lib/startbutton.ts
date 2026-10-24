import { createHmac, timingSafeEqual } from "node:crypto";
import type { CurrencyCode } from "@/generated/prisma/enums";

const STARTBUTTON_BASE = "https://api.startbutton.tech";

// Flowboc subscriptions bill in USD only, charged by card through
// Startbutton's USD wallet — independent of whatever currency an instructor
// charges their own students in (Instructor.currency, used for class
// bookings/payouts, is unrelated to this).
export const SUBSCRIPTION_CURRENCIES: CurrencyCode[] = ["USD"];

export class StartbuttonError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "StartbuttonError";
  }
}

async function startbuttonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env["STARTBUTTON_SECRET_KEY"];
  if (!key) throw new StartbuttonError("Startbutton is not configured.");

  const res = await fetch(`${STARTBUTTON_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    throw new StartbuttonError(body?.message ?? `Startbutton request failed (${res.status})`);
  }

  return body.data as T;
}

// Startbutton's plan frequency values, confirmed against the live API —
// "annually" is the only accepted value for a yearly plan ("yearly",
// "annual", and "year" are all rejected with a 422).
const FREQUENCY_BY_INTERVAL = {
  MONTHLY: "monthly",
  ANNUAL: "annually",
} as const;

export async function createSubscriptionPlan(input: {
  name: string;
  description: string;
  interval: "MONTHLY" | "ANNUAL";
  currency: CurrencyCode;
  // Major-unit price (e.g. 20000 for ₦20,000) — same convention as the
  // Paystack integration this replaces.
  amount: number;
  // Where Startbutton sends the payer after a successful charge. Docs
  // document `redirectUrl` for payment requests generally, but it's
  // UNCONFIRMED whether /subscription/api honors it — a test create call
  // accepted the field without error but didn't echo it back the way
  // name/description/frequency/currency are. Passed anyway since it costs
  // nothing if ignored; verify during the webhook spike and don't rely on
  // the instructor's browser actually landing back here (billing-client.tsx
  // doesn't depend on a query param from this redirect for that reason).
  redirectUrl: string;
}): Promise<{ providerPlanCode: string; checkoutLink: string }> {
  const data = await startbuttonFetch<{
    subscription: { code: string; link: string };
  }>("/subscription/api", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      frequency: FREQUENCY_BY_INTERVAL[input.interval],
      currency: input.currency,
      type: "fixed",
      amount: input.amount,
      redirectUrl: input.redirectUrl,
    }),
  });

  return { providerPlanCode: data.subscription.code, checkoutLink: data.subscription.link };
}

export async function cancelSubscriber(input: {
  subscriberId: string;
  reason: string;
}): Promise<void> {
  await startbuttonFetch<unknown>(
    `/subscribers/${encodeURIComponent(input.subscriberId)}/update-status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "canceled", reason: input.reason }),
    },
  );
}

// Startbutton signs webhook payloads with HMAC-SHA512 of the raw request
// body, using the secret key, in the `x-startbutton-signature` header —
// same scheme as Paystack's, verified against their docs.
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const key = process.env["STARTBUTTON_SECRET_KEY"];
  if (!key) return false;

  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}
