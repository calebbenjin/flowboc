"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { namesLikelyMatch, payoutProviderForCurrency } from "@/lib/payout";
import {
  listBanks,
  resolveAccountNumber,
  createSubaccount,
  supportsAccountResolve,
  PaystackError,
  type PaystackBank,
} from "@/lib/paystack";

type ActionResult = { ok: true } | { ok: false; error: string };
type ConnectResult = { ok: true } | { ok: false; error: string; mismatchedAccountName?: string };

function maskLast4(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "•");
}

export async function listPayoutBanks(
  type: "bank" | "mobile_money",
): Promise<{ ok: true; banks: PaystackBank[] } | { ok: false; error: string }> {
  const instructor = await requireInstructor();

  try {
    const banks = await listBanks({
      currency: instructor.currency,
      ...(type === "mobile_money" ? { type } : {}),
    });
    return { ok: true, banks };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof PaystackError ? err.message : "Something went wrong.",
    };
  }
}

export async function resolvePayoutAccount(input: {
  bankCode: string;
  accountNumber: string;
}): Promise<{ ok: true; accountName: string } | { ok: false; error: string }> {
  const instructor = await requireInstructor();

  if (!supportsAccountResolve(instructor.currency)) {
    return { ok: false, error: "Account name verification isn't available for your currency." };
  }

  try {
    const result = await resolveAccountNumber({
      currency: instructor.currency,
      accountNumber: input.accountNumber,
      bankCode: input.bankCode,
    });
    return { ok: true, accountName: result.accountName };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof PaystackError ? err.message : "Couldn't verify that account.",
    };
  }
}

export async function connectPayoutAccount(input: {
  method: "bank" | "mobile_money";
  bankCode: string;
  bankName: string;
  accountNumber: string; // phone number, for the mobile_money method
  // Set once the instructor has seen the mismatch warning (see
  // PayoutConnectForm) and confirmed the account is theirs anyway — e.g. a
  // married name or a registered business account. Re-checked here rather
  // than trusted from the client alone since this is the authoritative gate:
  // it also catches currencies where the client never got to pre-verify
  // (see supportsAccountResolve).
  confirmNameMismatch?: boolean;
}): Promise<ConnectResult> {
  const instructor = await requireInstructor();

  if (payoutProviderForCurrency(instructor.currency) !== "PAYSTACK") {
    return { ok: false, error: "Payouts for your currency aren't available yet." };
  }

  try {
    const { subaccountCode, accountName } = await createSubaccount({
      businessName: instructor.name,
      settlementBank: input.bankCode,
      accountNumber: input.accountNumber,
    });

    if (
      accountName &&
      !namesLikelyMatch(instructor.name, accountName) &&
      !input.confirmNameMismatch
    ) {
      return {
        ok: false,
        error: `This account is registered to "${accountName}", which doesn't match your profile name (${instructor.name}).`,
        mismatchedAccountName: accountName,
      };
    }

    const last4 = maskLast4(input.accountNumber);
    const label = accountName
      ? `${input.bankName} — ${accountName} •••• ${last4}`
      : `${input.bankName} •••• ${last4}`;

    await prisma.instructor.update({
      where: { id: instructor.id },
      data: {
        payoutProvider: "PAYSTACK",
        payoutStatus: "CONNECTED",
        payoutAccountId: subaccountCode,
        payoutBankLabel: label,
      },
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof PaystackError ? err.message : "Couldn't connect that account.",
    };
  }
}

export async function disconnectPayoutAccount(): Promise<ActionResult> {
  const instructor = await requireInstructor();

  // Doesn't deactivate the subaccount on Paystack's side — an orphaned,
  // unused subaccount is harmless, and this avoids a second failure mode
  // (what happens if Paystack's deactivate call fails but we've already
  // cleared our own record).
  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { payoutStatus: "NOT_CONNECTED", payoutAccountId: null, payoutBankLabel: null },
  });

  return { ok: true };
}
