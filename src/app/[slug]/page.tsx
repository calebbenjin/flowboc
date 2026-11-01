import { getPublicPageContent } from "@/lib/public-page-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { PublicPageClient } from "./public-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const instructor = await prisma.instructor.findUnique({ where: { slug } });
  if (!instructor) return {};

  const title = `${instructor.name} — Book a yoga class`;
  return {
    title,
    description: `Book upcoming yoga classes with ${instructor.name}${instructor.location ? ` in ${instructor.location}` : ""}. No account needed.`,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description: "Upcoming classes, live availability and instant booking.",
      type: "profile",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const instructor = await prisma.instructor.findUnique({
    where: { slug },
    include: {
      socials: true,
      links: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });
  if (!instructor || !instructor.onboardingCompletedAt) notFound();

  after(() => prisma.pageView.create({ data: { instructorId: instructor.id, path: `/${slug}` } }));

  const content = await getPublicPageContent(instructor);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: instructor.name,
    url: `${siteUrl}/${instructor.slug}`,
    ...(instructor.photoUrl ? { image: instructor.photoUrl } : {}),
    ...(instructor.bio ? { description: instructor.bio } : {}),
    jobTitle: "Yoga Instructor",
    ...(instructor.location
      ? { address: { "@type": "PostalAddress", addressLocality: instructor.location } }
      : {}),
  };

  return (
    <>
      <JsonLd data={personJsonLd} />
      <PublicPageClient {...content} />
    </>
  );
}
