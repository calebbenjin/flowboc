import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { guides } from "@/lib/guides";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/guides", priority: 0.7, changeFrequency: "weekly" },
    { path: "/referral-program", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  // Published instructor pages — the actual product surface, left out of the
  // sitemap would mean it never gets discovered via search-engine crawling.
  const instructors = await prisma.instructor.findMany({
    where: { onboardingCompletedAt: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const instructorEntries = instructors.map(({ slug, updatedAt }) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const guideEntries = guides.map(({ slug, updated }) => ({
    url: `${siteUrl}/guides/${slug}`,
    lastModified: new Date(updated),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...guideEntries, ...instructorEntries];
}
