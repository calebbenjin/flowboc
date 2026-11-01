export type OfferState = { label: string; ready: boolean; configured: boolean };
export function offerState({
  enabled,
  hasContent,
  hasRequiredAsset,
  price,
  payoutConnected,
}: {
  enabled: boolean;
  hasContent: boolean;
  hasRequiredAsset: boolean;
  price: number | null;
  payoutConnected: boolean;
}): OfferState {
  if (!enabled)
    return {
      label: hasContent ? "Hidden from your page" : "Not set up yet",
      ready: false,
      configured: hasContent,
    };
  if (!hasRequiredAsset) return { label: "Finish setup", ready: false, configured: true };
  if ((price ?? 0) > 0 && !payoutConnected)
    return { label: "Connect payouts", ready: false, configured: true };
  return { label: "On your public page", ready: true, configured: true };
}
