import type { Metadata } from "next";
import { getAllFeedback } from "./queries";
import { AdminFeedbackClient } from "./admin-feedback-client";

export const metadata: Metadata = {
  title: "Feedback admin — Flowboc",
};

export default async function AdminFeedbackPage() {
  const feedback = await getAllFeedback();
  return <AdminFeedbackClient feedback={feedback} />;
}
