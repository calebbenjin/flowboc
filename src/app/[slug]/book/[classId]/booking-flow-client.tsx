"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useRef, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  Download,
  Loader2,
  Lock,
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Flower2,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsletterOptIn } from "@/components/NewsletterOptIn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriceTag } from "@/components/PriceTag";
import { money, timezoneLabel, type CurrencyCode } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { googleCalendarUrl } from "@/lib/calendar";
import styles from "./booking.module.css";
import { usePendingAction } from "@/hooks/use-pending-action";
import {
  checkResumableBooking,
  createBookingIntent,
  initiatePayment,
  verifyPayment,
} from "./actions";

const NETWORK_ERROR_MESSAGE = "Network error — please check your connection and try again.";

function resumeKey(classId: string) {
  return `flowboc-booking-${classId}`;
}

type Step = "details" | "payment" | "confirming" | "done";

export type BookableClass = {
  id: string;
  name: string;
  coverUrl: string | null;
  description?: string | null;
  startAt: Date;
  timezone: string;
  durationMinutes: number;
  mode: "IN_PERSON" | "ONLINE";
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
  instructorPhoto = null,
  accentColor = "#6355ff",
}: {
  slug: string;
  instructorName: string;
  currency: CurrencyCode;
  cls: BookableClass;
  instructorPhoto?: string | null;
  accentColor?: string;
}) {
  const searchParams = useSearchParams();
  const returningReference = searchParams.get("reference");

  const [step, setStep] = useState<Step>(returningReference ? "confirming" : "details");
  const [name, setName] = useState("");
  const progressRef = useRef<HTMLElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    progressRef.current?.focus({ preventScroll: true });
    progressRef.current?.scrollIntoView({ block: "start" });
  }, [step]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  // "checking" until we know whether this visitor is sitting on their own
  // unexpired reservation — gates the "class is full" screen below so a
  // closed/declined checkout doesn't look like a dead end.
  const [resumeStatus, setResumeStatus] = useState<"checking" | "resumable" | "none" | "error">(
    returningReference ? "none" : "checking",
  );

  const detailsAction = usePendingAction();
  const payAction = usePendingAction();
  const confirmAction = usePendingAction();

  // Paystack appends ?reference= to the callback URL on return — verify it
  // once rather than trusting the redirect alone (the webhook is the real
  // source of truth, but this gives the student instant feedback without
  // waiting on it). Exposed as a function (not just an effect) so the
  // "confirming" step's retry button can re-run it after a dropped
  // connection, instead of leaving the student stuck on a spinner forever.
  const runVerify = useCallback(async () => {
    if (!returningReference) return;
    setConfirmError(null);
    const outcome = await confirmAction.run(() => verifyPayment(returningReference));

    if (outcome.outcome !== "success") {
      setConfirmError(NETWORK_ERROR_MESSAGE);
      return;
    }
    const result = outcome.value;
    if (result.ok) {
      setBookingId(result.bookingId);
      setStep("done");
    } else {
      if (result.bookingId) setBookingId(result.bookingId);
      toast.error(result.error);
      setStep("payment");
    }
    // confirmAction is a stable ref from usePendingAction — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returningReference]);

  useEffect(() => {
    void runVerify();
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
    checkResumableBooking(stored)
      .then((result) => {
        if (result.ok) {
          setBookingId(stored);
          setStep(result.step);
          setResumeStatus("resumable");
        } else {
          localStorage.removeItem(key);
          setResumeStatus("none");
        }
      })
      .catch(() => {
        // Network failure, not "no reservation" — don't drop the stored id,
        // a retry (reload) might still succeed.
        setResumeStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === "done") localStorage.removeItem(resumeKey(cls.id));
  }, [step, cls.id]);

  async function handlePay() {
    if (!bookingId) return;
    const outcome = await payAction.run(() => initiatePayment(bookingId));
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    const result = outcome.value;
    if (result.ok) {
      window.location.href = result.authorizationUrl;
    } else {
      toast.error(result.error);
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

  if (cls.spots <= 0 && resumeStatus === "error") {
    return (
      <div className="min-h-screen bg-sand/50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:text-clay">
            ← {instructorName}
          </Link>
          <div className="surface mt-6 p-8">
            <AlertTriangle className="mx-auto size-6 text-warning-foreground" />
            <h1 className="mt-4 text-2xl">Couldn&apos;t check your reservation</h1>
            <p className="mt-2 text-muted-foreground">{NETWORK_ERROR_MESSAGE}</p>
            <Button variant="clay" className="mt-6" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cls.spots <= 0 && resumeStatus !== "resumable" && step === "details") {
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

    const outcome = await detailsAction.run(() =>
      createBookingIntent({
        slug,
        classId: cls.id,
        studentName: String(formData.get("fn") ?? ""),
        studentEmail: String(formData.get("em") ?? ""),
        studentPhone: String(formData.get("ph") ?? ""),
        emergencyContact: String(formData.get("ec") ?? ""),
        notes: String(formData.get("nt") ?? ""),
        newsletterOptIn: formData.get("newsletterOptIn") === "on",
      }),
    );
    if (outcome.outcome !== "success") {
      toast.error(NETWORK_ERROR_MESSAGE);
      return;
    }
    const result = outcome.value;
    if (result.ok) {
      if (
        process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
        process.env["NEXT_PUBLIC_POSTHOG_HOST"]
      ) {
        posthog.capture("booking_details_submitted", { currency, is_free: result.isFree });
      }
      if (!result.isFree) localStorage.setItem(resumeKey(cls.id), result.bookingId);
      setBookingId(result.bookingId);
      setStep(result.isFree ? "done" : "payment");
    } else {
      toast.error(result.error);
    }
  }

  const steps: Step[] = cls.price === 0 ? ["details", "done"] : ["details", "payment", "done"];
  return (
    <div className={styles["page"]} style={{ "--booking-accent": accentColor } as CSSProperties}>
      <div className={styles["container"]}>
        <Link href={`/${slug}`} className={styles["back"]}>
          <ArrowLeft size={15} /> Back to {instructorName.split(" ")[0]}’s page
        </Link>
        <header className={styles["teacher"]}>
          {instructorPhoto ? (
            <img src={instructorPhoto} alt="" width={40} height={40} />
          ) : (
            <span>
              <Flower2 size={23} strokeWidth={1.3} />
            </span>
          )}
          <div>
            <small>A little time for yourself</small>
            <p>Practice with {instructorName}</p>
          </div>
        </header>
        <section className={styles["summary"]} aria-label="Your class">
          {cls.coverUrl && (
            <img src={cls.coverUrl} alt="" width={800} height={400} className={styles["cover"]} />
          )}
          <div className={styles["summaryBody"]}>
            <div className={styles["titleRow"]}>
              <div>
                <span className={styles["eyebrow"]}>
                  {cls.mode === "ONLINE" ? "An online practice" : "Meet on the mat"}
                </span>
                <h1>{cls.name}</h1>
              </div>
              <div className={styles["price"]}>
                <PriceTag
                  price={cls.price}
                  originalPrice={cls.originalPrice ?? undefined}
                  currency={currency}
                />
                <span>{cls.price === 0 ? "No payment needed" : "per person"}</span>
              </div>
            </div>
            <dl className={styles["classDetails"]}>
              <div>
                <CalendarDays size={18} />
                <dt>Date</dt>
                <dd>{formatClassDate(cls)}</dd>
              </div>
              <div>
                <Clock size={18} />
                <dt>Time & duration</dt>
                <dd>
                  {formatClassTime(cls)} · {cls.durationMinutes} min
                  <small>{timezoneLabel(cls.timezone)}</small>
                </dd>
              </div>
              <div>
                {cls.mode === "ONLINE" ? <Video size={18} /> : <MapPin size={18} />}
                <dt>{cls.mode === "ONLINE" ? "Online class" : "Location"}</dt>
                <dd>
                  {cls.mode === "ONLINE"
                    ? "Joining details in your confirmation email"
                    : (cls.location ?? "Location to be confirmed")}
                </dd>
              </div>
            </dl>
            {cls.description?.trim() && (
              <section className={styles["about"]} aria-labelledby="about-class">
                <h2 id="about-class">About this practice</h2>
                <p>{cls.description}</p>
              </section>
            )}
            {cls.cancellationPolicy && (
              <details className={styles["policy"]}>
                <summary>
                  Cancellation policy <ChevronDown size={14} />
                </summary>
                <p>{cls.cancellationPolicy}</p>
              </details>
            )}
          </div>
        </section>
        <nav
          ref={progressRef}
          tabIndex={-1}
          className={styles["steps"]}
          aria-label="Booking progress"
        >
          <ol>
            {steps.map((value, index) => {
              const active = step === value || (value === "payment" && step === "confirming");
              const completed = steps.indexOf(step === "confirming" ? "payment" : step) > index;
              return (
                <li
                  key={value}
                  aria-current={active ? "step" : undefined}
                  data-complete={completed}
                >
                  <span>{completed ? <Check size={12} /> : index + 1}</span>
                  {value === "details"
                    ? "Your details"
                    : value === "payment"
                      ? "Payment"
                      : "Confirmed"}
                </li>
              );
            })}
          </ol>
        </nav>

        {step === "details" && (
          <form className={styles["panel"]} onSubmit={(e) => void handleDetailsSubmit(e)}>
            <div className={styles["panelHeading"]}>
              <h2>Your place starts here</h2>
              <p>No account needed. Just a few details so your teacher can welcome you.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fn">Full name</Label>
                <Input
                  id="fn"
                  name="fn"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Johnson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="em">Email</Label>
                <Input
                  id="em"
                  name="em"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">Phone number</Label>
                <Input
                  id="ph"
                  name="ph"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+234 803 000 0000"
                />
              </div>
            </div>
            <details className={styles["optional"]}>
              <summary>
                <div>
                  A note for your teacher
                  <span>Optional · emergency contact or anything you’d like to share</span>
                </div>
                <ChevronDown size={16} />
              </summary>
              <div className={styles["optionalFields"]}>
                <div className="space-y-2">
                  <Label htmlFor="ec">Emergency contact</Label>
                  <Input id="ec" name="ec" placeholder="Name and number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nt">Anything you’d like your teacher to know?</Label>
                  <Textarea
                    id="nt"
                    name="nt"
                    rows={3}
                    placeholder="First class, accessibility needs, or a question about the practice…"
                  />
                </div>
                <p>Only share what you’re comfortable sharing.</p>
              </div>
            </details>
            <NewsletterOptIn />

            <Button
              type="submit"
              variant="default"
              size="lg"
              className={styles["primary"]}
              disabled={detailsAction.isPending}
            >
              {detailsAction.isSlow
                ? "Still working — check your connection…"
                : detailsAction.isPending
                  ? "Reserving your spot…"
                  : cls.price === 0
                    ? "Reserve my spot"
                    : "Continue to payment"}
            </Button>
          </form>
        )}

        {step === "payment" && (
          <div className={styles["panel"]}>
            <div className={styles["panelHeading"]}>
              <h2>One last step to the mat</h2>
              <p>Your total is below. Complete payment to confirm your place.</p>
            </div>
            <div className={styles["total"]}>
              <span>{cls.name}</span>
              <span className="font-medium">{money(cls.price, currency)}</span>
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> You&apos;ll be redirected to Paystack&apos;s secure
              checkout to pay — Flowboc never sees your card details.
            </p>
            <Button
              type="button"
              variant="clay"
              size="lg"
              className={styles["primary"]}
              disabled={payAction.isPending}
              onClick={() => void handlePay()}
            >
              {payAction.isSlow
                ? "Still working — check your connection…"
                : payAction.isPending
                  ? "Redirecting to checkout…"
                  : `Pay ${money(cls.price, currency)}`}
            </Button>
          </div>
        )}

        {step === "confirming" && (
          <div className={styles["confirmation"]}>
            {confirmError ? (
              <>
                <AlertTriangle className="mx-auto size-6 text-warning-foreground" />
                <p className="mt-4 text-muted-foreground">{confirmError}</p>
                <Button
                  variant="clay"
                  className="mt-6"
                  disabled={confirmAction.isPending}
                  onClick={() => void runVerify()}
                >
                  {confirmAction.isPending ? "Checking…" : "Try again"}
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {confirmAction.isSlow
                    ? "Still confirming — this is taking longer than usual…"
                    : "Confirming your payment…"}
                </p>
              </>
            )}
          </div>
        )}

        {step === "done" && (
          <div className={styles["confirmation"]}>
            <div className={styles["successIcon"]}>
              <Check size={26} strokeWidth={1.5} />
            </div>
            <span className={styles["eyebrow"]}>A little space, just for you</span>
            <h2 className="mt-3 text-3xl">You’re on the mat.</h2>
            <p className="mt-2 text-muted-foreground">
              {name ? `${name}, your` : "Your"} place in {cls.name} with{" "}
              {instructorName.split(" ")[0]} is confirmed.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatClassDate(cls)} · {formatClassTime(cls)} {timezoneLabel(cls.timezone)} ·{" "}
              {cls.mode === "ONLINE"
                ? "Online class"
                : (cls.location ?? "Location to be confirmed")}
            </p>
            <p className="mt-4 text-sm">
              {cls.price === 0
                ? "Your place is reserved. No payment needed."
                : `Your payment of ${money(cls.price, currency)} is confirmed.`}{" "}
              Your booking confirmation will be sent by email.
            </p>

            <div className={styles["nextSteps"]}>
              <h3>Before your practice</h3>
              <p>
                {cls.mode === "ONLINE"
                  ? "Check your confirmation email for the joining details. Give yourself a few minutes to settle in before class."
                  : "Check the class location above and your confirmation email for any instructions from your teacher."}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="quiet" asChild>
                <a
                  href={googleCalendarUrl({
                    title: cls.name,
                    startAt: cls.startAt,
                    durationMinutes: cls.durationMinutes,
                    location: cls.location,
                    details: `Booked with ${instructorName} via Flowboc`,
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
        <footer className={styles["footer"]}>
          Booking with <Link href="/">Flowboc</Link> · A little more space for your practice.
        </footer>
      </div>
    </div>
  );
}
