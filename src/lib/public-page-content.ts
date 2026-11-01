import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canUseProOffers } from "@/lib/offer-access";
import { newsletterButtonVisible } from "@/lib/newsletter/access";
import { effectivePublicTheme } from "@/lib/public-page-theme";
import { resolveBlockOrder } from "@/lib/public-page-blocks";

// Both the public page and the authenticated live preview use this content.
export async function getPublicPageContent(
  instructor: Prisma.InstructorGetPayload<{ include: { socials: true; links: true } }>,
) {
  // Resolved against only the active links being rendered — an inactive
  // link's token is naturally dropped here without losing its stored
  // position (resolveBlockOrder is fed ALL links on the dashboard side).
  const blockOrder = resolveBlockOrder(
    instructor.publicPageBlockOrder,
    instructor.links.map((l) => l.id),
  );

  const classes = await prisma.yogaClass.findMany({
    where: {
      instructorId: instructor.id,
      status: { in: ["PUBLISHED", "FULL"] },
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: "asc" },
    include: {
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } } },
        },
      },
    },
  });

  return {
    instructor: {
      ...effectivePublicTheme(instructor),
      name: instructor.name,
      slug: instructor.slug,
      photoUrl: instructor.photoUrl,
      bio: instructor.bio,
      location: instructor.location,
      email: instructor.email,
      phone: instructor.phone,
      consultationLink: instructor.consultationLink,
      specialties: instructor.specialties,
      currency: instructor.currency,
      themeColor: instructor.themeColor,
      newsletterEnabled: newsletterButtonVisible(instructor),
      backgroundType: instructor.backgroundType,
      backgroundImageUrl: instructor.backgroundImageUrl,
      backgroundColor: instructor.backgroundColor,
      backgroundGradientFrom: instructor.backgroundGradientFrom,
      backgroundGradientTo: instructor.backgroundGradientTo,
      pageLayout: instructor.pageLayout,
      videoCallEnabled: canUseProOffers(instructor) && instructor.videoCallEnabled,
      videoCallTitle: instructor.videoCallTitle,
      videoCallDescription: instructor.videoCallDescription,
      videoCallImageUrl: instructor.videoCallImageUrl,
      videoCallPrice: instructor.videoCallPrice,
      ebookEnabled: canUseProOffers(instructor) && instructor.ebookEnabled,
      ebookTitle: instructor.ebookTitle,
      ebookDescription: instructor.ebookDescription,
      ebookCoverUrl: instructor.ebookCoverUrl,
      ebookPrice: instructor.ebookPrice,
      payoutConnected: instructor.payoutStatus === "CONNECTED" && !!instructor.payoutAccountId,
      socials: instructor.socials.map((s) => ({
        platform: s.platform.toLowerCase(),
        handle: s.handle,
      })),
      links: instructor.links.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        imageUrl: l.imageUrl,
      })),
    },
    classes: classes.map((c) => ({
      id: c.id,
      seriesId: c.seriesId,
      recurringLabel: c.recurringLabel,
      name: c.name,
      coverUrl: c.coverUrl,
      description: c.description,
      startAt: c.startAt,
      timezone: c.timezone,
      durationMinutes: c.durationMinutes,
      mode: c.mode,
      location: c.location,
      price: c.price,
      originalPrice: c.originalPrice,
      capacity: c.capacity,
      spots: Math.max(0, c.capacity - c._count.bookings),
    })),
    blockOrder,
  };
}
