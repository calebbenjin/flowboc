import type { Metadata } from "next";
import { getAllReferralPayoutRequests } from "./queries";
import { AdminReferralPayoutsClient } from "./admin-referral-payouts-client";

export const metadata: Metadata = {
  title: "Referral payouts admin — Flowboc",
};

export default async function AdminReferralPayoutsPage() {
  const requests = await getAllReferralPayoutRequests();
  return <AdminReferralPayoutsClient requests={requests} />;
}
