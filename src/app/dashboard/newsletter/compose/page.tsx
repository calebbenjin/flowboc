import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { ComposeClient } from "./compose-client";
import { syncSubscribersFromBookings } from "../queries";

export const metadata: Metadata = {
  title: "New campaign — Flowboc",
};

export default async function ComposePage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  await syncSubscribersFromBookings(instructor.id);

  const subscriberCount = await prisma.newsletterSubscriber.count({
    where: { instructorId: instructor.id, status: "SUBSCRIBED" },
  });

  return <ComposeClient subscriberCount={subscriberCount} />;
}
