"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, Check, Download, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriceTag } from "@/components/PriceTag";
import { money, timezoneLabel, type CurrencyCode } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { googleCalendarUrl } from "@/lib/calendar";
import {
  checkResumableBooking,
  createBookingIntent,
  initiatePayment,
  verifyPayment,
} from "./actions";

function resumeKey(classId: string) {
  return `flowbuk-booking-${classId}`;
}

type Step = "details" | "payment" | "confirming" | "done";

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
  currency,
  cls,
}: {
  slug: string;
  instructorName: string;
  currency: CurrencyCode;
  cls: BookableClass;
}) {
  const searchParams = useSearchParams();
  const returningReference = searchParams.get("reference");

  const [step, setStep] = useState<Step>(returningReference ? "confirming" : "details");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [payPending, setPayPending] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  // "checking" until we know whether this visitor is sitting on their own
  // unexpired reservation — gates the "class is full" screen below so a
  // closed/declined checkout doesn't look like a dead end.
  const [resumeStatus, setResumeStatus] = useState<"checking" | "resumable" | "none">(
    returningReference ? "none" : "checking",
  );

  // Paystack appends ?reference= to the callback URL on return — verify it
  // once on mount rather than trusting the redirect alone (the webhook is
  // the real source of truth, but this gives the student instant feedback
  // without waiting on it).
  useEffect(() => {
    if (!returningReference) return;
    void verifyPayment(returningReference).then((result) => {
      if (result.ok) {
        setBookingId(result.bookingId);
        setStep("done");
      } else {
        if (result.bookingId) setBookingId(result.bookingId);
        toast.error(result.error);
        setStep("payment");
      }
    });
    // Only ever run once, for whatever reference was in the URL on first
    // render — not meant to re-run as other state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paystack only redirects back with a reference on a completed checkout —
  // closing the widget or a declined attempt leaves no signal at all. Check
  // whether a reservation from earlier in this browser is still alive so we
  // can resume it instead of falling through to "this class just filled up".
  useEffect(() => {
    if (returningReference) return;
    const key = resumeKey(cls.id);
    const stored = localStorage.getItem(key);
    if (!stored) {
      setResumeStatus("none");
      return;
    }
    void checkResumableBooking(stored).then((result) => {
      if (result.ok) {
        setBookingId(stored);
        setStep(result.step);
        setResumeStatus("resumable");
      } else {
        localStorage.removeItem(key);
        setResumeStatus("none");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === "done") localStorage.removeItem(resumeKey(cls.id));
  }, [step, cls.id]);

  async function handlePay() {
    if (!bookingId) return;
    setPayPending(true);
    try {
      const result = await initiatePayment(bookingId);
      if (result.ok) {
        window.location.href = result.authorizationUrl;
      } else {
        toast.error(result.error);
        setPayPending(false);
      }
    } catch {
      toast.error("Couldn't start payment. Please try again.");
      setPayPending(false);
    }
  }

  if (cls.spots <= 0 && resumeStatus === "checking") {
    return (
      <div className="min-h-screen bg-sand/50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (cls.spots <= 0 && resumeStatus !== "resumable") {
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
        if (!result.isFree) localStorage.setItem(resumeKey(cls.id), result.bookingId);
        setBookingId(result.bookingId);
        setStep(result.isFree ? "done" : "payment");
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

        <div className="surface mt-4 p-5">
          <div className="flex items-center gap-4 mb-4">
            {cls.coverUrl ? (
              <img
                src={cls.coverUrl}
                alt={cls.name}
                loading="lazy"
                width={1200}
                height={800}
                className="size-16 rounded-md object-cover"
              />
            ) : (
              <div className="size-16 shrink-0 rounded-md bg-sand" />
            )}
            <div className="flex-1 mt-2">
              <h1 className="text-xl">{cls.name}</h1>
              <p className="text-sm text-muted-foreground">
                {formatClassDate(cls)} · {formatClassTime(cls)} {timezoneLabel(cls.timezone)} ·{" "}
                {cls.durationMinutes} min · {cls.location ?? "Location TBC"}
              </p>
            </div>
          </div>
          <PriceTag
            price={cls.price}
            originalPrice={cls.originalPrice ?? undefined}
            currency={currency}
            priceClassName="display text-xl"
          />
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          {(["details", "payment", "done"] as const).map((s, i) => {
            const active = step === s || (s === "payment" && step === "confirming");
            return (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={
                    active
                      ? "rounded-full bg-clay px-2.5 py-1 font-medium text-clay-foreground"
                      : "rounded-full bg-secondary px-2.5 py-1"
                  }
                >
                  {i + 1}.{" "}
                  {s === "details" ? "Your details" : s === "payment" ? "Payment" : "Confirmed"}
                </span>
                {i < 2 && <span className="h-px w-6 bg-border" />}
              </div>
            );
          })}
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
            <Button type="submit" variant="default" size="lg" className="w-full" disabled={pending}>
              {pending ? "Reserving your spot…" : "Continue to payment"}
            </Button>
          </form>
        )}

        {step === "payment" && (
          <div className="surface mt-4 space-y-4 p-6">
            <div className="flex items-center justify-between rounded-lg bg-sand/70 px-4 py-3 text-sm">
              <span>{cls.name}</span>
              <span className="font-medium">{money(cls.price, currency)}</span>
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> You&apos;ll be redirected to Paystack&apos;s secure
              checkout to pay — Flowbuk never sees your card details.
            </p>
            <Button
              type="button"
              variant="clay"
              size="lg"
              className="w-full"
              disabled={payPending}
              onClick={() => void handlePay()}
            >
              {payPending ? "Redirecting to checkout…" : `Pay ${money(cls.price, currency)}`}
            </Button>
          </div>
        )}

        {step === "confirming" && (
          <div className="surface mt-4 p-8 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Confirming your payment…</p>
          </div>
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
              Payment of {money(cls.price, currency)} was successful. A confirmation email is on its
              way.
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
