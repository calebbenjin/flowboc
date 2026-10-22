import type { Metadata } from "next";
import { getAllReferrals } from "./queries";
import { AdminReferralsClient } from "./admin-referrals-client";

export const metadata: Metadata = {
  title: "Referrals admin — Flowboc",
};

export default async function AdminReferralsPage() {
  const referrals = await getAllReferrals();
  return <AdminReferralsClient referrals={referrals} />;
}
