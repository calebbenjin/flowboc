import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Unsubscribe — Flowbuk",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const subscriber = token
    ? await prisma.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token },
        include: { instructor: { select: { name: true } } },
      })
    : null;

  if (subscriber && subscriber.status === "SUBSCRIBED") {
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-sand/50 px-4">
      <div className="surface max-w-sm p-8 text-center">
        {subscriber ? (
          <>
            <h1 className="text-xl">You&apos;re unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You won&apos;t receive any more emails from {subscriber.instructor.name}.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl">Link no longer valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This unsubscribe link has already been used or has expired.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
