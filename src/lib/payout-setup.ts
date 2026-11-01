export function payoutReady(account: { payoutStatus?: string; payoutAccountId?: string | null }) {
  return account.payoutStatus === "CONNECTED" && !!account.payoutAccountId;
}

export function needsPayoutSetup(
  account: Parameters<typeof payoutReady>[0],
  price: number,
  publishing = true,
) {
  return publishing && price > 0 && !payoutReady(account);
}
