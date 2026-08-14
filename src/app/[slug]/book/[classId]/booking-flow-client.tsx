"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Check, CreditCard, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriceTag } from "@/components/PriceTag";
import { money, timezoneLabel } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { googleCalendarUrl } from "@/lib/calendar";
import { createBookingIntent } from "./actions";

type Step = "details" | "payment" | "done";

export type BookableClass = {
  id: string;
  name: string;
  coverUrl: string | null;
  startAt: Date;
  timezone: string;
  durationMinutes: number;
  location: string | null;
  price: number;
  originalPrice: number | null;
  cancellationPolicy: string | null;
  spots: number;
};

export function BookingFlowClient({
  slug,
  instructorName,
  cls,
}: {
  slug: string;
  instructorName: string;
  cls: BookableClass;
}) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  if (cls.spots <= 0) {
    return (
      <div className="min-h-screen bg-sand/50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:text-clay">
            ← {instructorName}
          </Link>
          <div className="surface mt-6 p-8">
            <h1 className="text-2xl">This class just filled up</h1>
            <p className="mt-2 text-muted-foreground">
              Join the waitlist from {instructorName}&apos;s booking page and we&apos;ll let you
              know if a spot opens.
            </p>
            <Button asChild variant="clay" className="mt-6">
              <Link href={`/${slug}`}>Back to booking page</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  async function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setPending(true);
    try {
      const result = await createBookingIntent({
        slug,
        classId: cls.id,
        studentName: String(formData.get("fn") ?? ""),
        studentEmail: String(formData.get("em") ?? ""),
        studentPhone: String(formData.get("ph") ?? ""),
        emergencyContact: String(formData.get("ec") ?? ""),
        notes: String(formData.get("nt") ?? ""),
      });
      if (result.ok) {
        setBookingId(result.bookingId);
        setStep("payment");
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand/50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:text-clay">
          ← {instructorName}
        </Link>

        <div className="surface mt-4 flex items-center gap-4 p-5">
          {cls.coverUrl ? (
            <img
              src={cls.coverUrl}
              alt={cls.name}
              loading="lazy"
              width={1200}
              height={800}
              className="size-16 rounded-lg object-cover"
            />
          ) : (
            <div className="size-16 shrink-0 rounded-lg bg-sand" />
          )}
          <div className="flex-1">
            <h1 className="text-xl">{cls.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatClassDate(cls)} · {formatClassTime(cls)} {timezoneLabel(cls.timezone)} ·{" "}
              {cls.durationMinutes} min · {cls.location ?? "Location TBC"}
            </p>
          </div>
          <PriceTag
            price={cls.price}
            originalPrice={cls.originalPrice ?? undefined}
            priceClassName="display text-xl"
          />
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          {(["details", "payment", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={
                  step === s
                    ? "rounded-full bg-clay px-2.5 py-1 font-medium text-clay-foreground"
                    : "rounded-full bg-secondary px-2.5 py-1"
                }
              >
                {i + 1}.{" "}
                {s === "details" ? "Your details" : s === "payment" ? "Payment" : "Confirmed"}
              </span>
              {i < 2 && <span className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>

        {step === "details" && (
          <form
            className="surface mt-4 space-y-4 p-6"
            onSubmit={(e) => void handleDetailsSubmit(e)}
          >
            <p className="text-sm text-muted-foreground">
              No account needed — just your details for the register.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fn">Full name</Label>
                <Input
                  id="fn"
                  name="fn"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Johnson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="em">Email</Label>
                <Input id="em" name="em" type="email" required placeholder="sarah@mail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">Phone number</Label>
                <Input id="ph" name="ph" required placeholder="+234 803 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ec">Emergency contact (optional)</Label>
                <Input id="ec" name="ec" placeholder="Name and number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nt">Anything I should know? (optional)</Label>
              <Textarea
                id="nt"
                name="nt"
                rows={2}
                placeholder="Injuries, first class, pregnancy…"
              />
            </div>
            {cls.cancellationPolicy && (
              <p className="text-xs text-muted-foreground">{cls.cancellationPolicy}</p>
            )}
            <Button type="submit" variant="clay" size="lg" className="w-full" disabled={pending}>
              {pending ? "Reserving your spot…" : "Continue to payment"}
            </Button>
          </form>
        )}

        {step === "payment" && (
          // Real Stripe/Paystack checkout replaces this mocked step in the
          // next batch — the booking above is already persisted as
          // paymentStatus: PENDING with a 15-minute reservation hold.
          <form
            className="surface mt-4 space-y-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setStep("done");
            }}
          >
            <div className="flex items-center justify-between rounded-lg bg-sand/70 px-4 py-3 text-sm">
              <span>{cls.name}</span>
              <span className="font-medium">{money(cls.price)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card">Card number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="card" className="pl-9" placeholder="4242 4242 4242 4242" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" placeholder="09 / 28" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" required />
              </div>
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> Payments are processed securely.
            </p>
            <Button type="submit" variant="clay" size="lg" className="w-full">
              Pay {money(cls.price)}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="surface mt-4 p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15">
              <Check className="size-6 text-success" />
            </div>
            <h2 className="mt-5 text-2xl">You're booked</h2>
            <p className="mt-2 text-muted-foreground">
              {name || "You"} are booked for {cls.name} with {instructorName.split(" ")[0]}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatClassDate(cls)} · {formatClassTime(cls)} {timezoneLabel(cls.timezone)} ·{" "}
              {cls.location ?? "Location TBC"}
            </p>
            <p className="mt-4 text-sm">
              Payment of {money(cls.price)} was successful. A confirmation email is on its way.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="quiet" asChild>
                <a
                  href={googleCalendarUrl({
                    title: cls.name,
                    startAt: cls.startAt,
                    durationMinutes: cls.durationMinutes,
                    location: cls.location,
                    details: `Booked with ${instructorName} via Flowbuk`,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CalendarPlus className="size-4" /> Add to Google Calendar
                </a>
              </Button>
              {bookingId && (
                <Button variant="quiet" asChild>
                  <a href={`/api/calendar/${bookingId}`} download>
                    <Download className="size-4" /> Download .ics
                  </a>
                </Button>
              )}
            </div>

            <Link href={`/${slug}`} className="mt-6 inline-block text-sm text-clay hover:underline">
              Book another class
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
