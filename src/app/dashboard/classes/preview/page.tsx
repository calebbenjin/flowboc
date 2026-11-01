import { notFound } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { prisma } from "@/lib/db";
import { getPublicPageContent } from "@/lib/public-page-content";
import { LivePreviewPage } from "./preview-client";

export default async function ClassPublicPreviewPage() {
  const account = await getCurrentInstructor();
  if (!account) notFound();
  const instructor = await prisma.instructor.findUnique({
    where: { id: account.id },
    include: { socials: true, links: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });
  if (!instructor) notFound();
  return <LivePreviewPage content={await getPublicPageContent(instructor)} />;
}
