import { createHmac, timingSafeEqual } from "node:crypto";
import type { CurrencyCode } from "@/generated/prisma/enums";
import { supportsAccountResolve } from "@/lib/payout";

const PAYSTACK_BASE = "https://api.paystack.co";

// Paystack's /bank endpoint takes a country name, not a currency code.
// Confirmed against the live API: "ivory coast" returns zero banks — the
// country param must be "cote d'ivoire".
const COUNTRY_BY_CURRENCY: Partial<Record<CurrencyCode, string>> = {
  NGN: "nigeria",
  GHS: "ghana",
  ZAR: "south africa",
  KES: "kenya",
  XOF: "cote d'ivoire",
};

export { supportsAccountResolve };

export class PaystackError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "PaystackError";
  }
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new PaystackError("Paystack is not configured.");

  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status === false) {
    throw new PaystackError(body?.message ?? `Paystack request failed (${res.status})`, body?.code);
  }

  return body.data as T;
}

export function countryForCurrency(currency: CurrencyCode): string | null {
  return COUNTRY_BY_CURRENCY[currency] ?? null;
}

export type PaystackBank = { name: string; code: string };

export async function listBanks(input: {
  currency: CurrencyCode;
  type?: "mobile_money";
}): Promise<PaystackBank[]> {
  const country = countryForCurrency(input.currency);
  if (!country) throw new PaystackError("This currency isn't supported by Paystack.");

  const params = new URLSearchParams({ country });
  if (input.type) params.set("type", input.type);

  const banks = await paystackFetch<{ name: string; code: string }[]>(`/bank?${params}`);
  // Paystack's bank list has duplicate entries (same name/code repeated) —
  // de-dupe by code for a clean dropdown.
  const seen = new Set<string>();
  return banks.filter((b) => {
    if (seen.has(b.code)) return false;
    seen.add(b.code);
    return true;
  });
}

export async function resolveAccountNumber(input: {
  currency: CurrencyCode;
  accountNumber: string;
  bankCode: string;
}): Promise<{ accountNumber: string; accountName: string }> {
  if (!supportsAccountResolve(input.currency)) {
    throw new PaystackError("Account verification isn't available for this currency.");
  }

  const params = new URLSearchParams({
    account_number: input.accountNumber,
    bank_code: input.bankCode,
    currency: input.currency,
  });

  const data = await paystackFetch<{ account_number: string; account_name: string }>(
    `/bank/resolve?${params}`,
  );

  return { accountNumber: data.account_number, accountName: data.account_name };
}

// Mobile money subaccounts use the exact same account_number/settlement_bank
// shape as bank accounts (confirmed against the live API — there's no
// separate mobile_money object for Subaccount creation, unlike the Transfer
// Recipient API). account_number is the phone number, settlement_bank is
// the mobile money provider's bank code (e.g. "MTN", "MPESA").
export async function createSubaccount(input: {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
}): Promise<{ subaccountCode: string; accountName: string | null }> {
  const data = await paystackFetch<{ subaccount_code: string; account_name: string | null }>(
    "/subaccount",
    {
      method: "POST",
      body: JSON.stringify({
        business_name: input.businessName,
        settlement_bank: input.settlementBank,
        account_number: input.accountNumber,
        // percentage_charge is what Flowboc keeps per transaction — 0 since
        // this is a subscription-only platform, not a transaction-fee one.
        percentage_charge: 0,
      }),
    },
  );

  return { subaccountCode: data.subaccount_code, accountName: data.account_name };
}

export async function initializeTransaction(input: {
  email: string;
  // Always the major-unit price (e.g. 5000 for ₦5,000) — Paystack wants the
  // minor unit (amount * 100) for every currency it supports, including
  // XOF, which has no real minor unit of its own. Confirmed against the
  // live API.
  amount: number;
  currency: CurrencyCode;
  subaccount: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const data = await paystackFetch<{ authorization_url: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amount * 100,
        currency: input.currency,
        subaccount: input.subaccount,
        // Whether this actually comes out of the student's charge or the
        // instructor's settlement is controlled by the account-level "who
        // bears transaction fees" setting in the Paystack dashboard — this
        // just makes sure that when the account is set to merchant-bears,
        // the fee comes out of the instructor's subaccount rather than
        // Flowboc's main account (which has a 0% split and nothing to
        // deduct from).
        bearer: "subaccount",
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    },
  );

  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  currency: CurrencyCode;
  reference: string;
  // Paystack's actual fee for this charge, in minor units — null on
  // anything but a settled success. Converted to major units by the caller.
  fees: number | null;
}> {
  const data = await paystackFetch<{
    status: string;
    amount: number;
    currency: CurrencyCode;
    reference: string;
    fees: number | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  return data;
}

// Paystack signs webhook payloads with HMAC-SHA512 of the raw request body,
// using the secret key, in the `x-paystack-signature` header. Must be
// computed over the raw body text, not a re-serialized/parsed object.
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) return false;

  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}
