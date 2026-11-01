"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Flower2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sampleClasses, planPricing, type PlanKey } from "./data";
import type { BillingInterval, PlanTier } from "@/generated/prisma/enums";

type PlanInfo = { price: number; planCode: string } | null;
// Shape returned by getActivePlansForCurrency() — live prices from the
// SubscriptionPlan table, keyed by tier then billing interval.
type PlansByTier = Record<PlanTier, Record<BillingInterval, PlanInfo>>;

const PLAN_KEY_TO_TIER: Record<PlanKey, PlanTier> = { starter: "STARTER", pro: "PRO" };

type View =
  | { kind: "closed" }
  | { kind: "booking-details"; classIndex: number }
  | { kind: "booking-review"; classIndex: number }
  | { kind: "booking-done"; classIndex: number }
  | { kind: "offer"; offer: "consultation" | "ebook" }
  | { kind: "email-preview" };

type BookingInfo = { name: string; email: string; phone: string };

type LaunchDialogApi = {
  openBooking: (classIndex: number) => void;
  openOffer: (offer: "consultation" | "ebook") => void;
  openEmailPreview: () => void;
  selectedPlan: PlanKey;
  setSelectedPlan: (plan: PlanKey) => void;
  billingInterval: "monthly" | "annual";
  setBillingInterval: (interval: "monthly" | "annual") => void;
  // Live DB price when configured in /admin/pricing, falling back to the
  // numbers in data.ts so the page still renders sane prices before pricing
  // has been set up for a tier/interval.
  planPrices: Record<PlanKey, { label: string; monthly: number; annual: number }>;
};

const LaunchDialogCtx = React.createContext<LaunchDialogApi | null>(null);

export function useLaunchDialog() {
  const ctx = React.useContext(LaunchDialogCtx);
  if (!ctx) throw new Error("useLaunchDialog must be used within LaunchDialogProvider");
  return ctx;
}

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mt-5 flex gap-1.5" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn("h-[3px] flex-1 rounded-full bg-[#ecdfef]", n <= step && "bg-[#6355ff]")}
        />
      ))}
    </div>
  );
}

function PreviewWarning() {
  return (
    <p className="mt-6 border-t border-[#ebdfef] pt-3 text-[11px] leading-[1.7] text-[#b899c4]">
      This is a design preview. No account, payment, or real booking is created. Details entered
      here are used only in this temporary preview.
    </p>
  );
}

export function LaunchDialogProvider({
  children,
  plans,
}: {
  children: React.ReactNode;
  plans?: PlansByTier;
}) {
  const [view, setView] = React.useState<View>({ kind: "closed" });
  const [booking, setBooking] = React.useState<BookingInfo>({ name: "", email: "", phone: "" });
  const [selectedPlan, setSelectedPlan] = React.useState<PlanKey>("starter");
  const [billingInterval, setBillingInterval] = React.useState<"monthly" | "annual">("monthly");
  const [formError, setFormError] = React.useState<string | null>(null);

  const planPrices = React.useMemo(() => {
    const keys: PlanKey[] = ["starter", "pro"];
    return Object.fromEntries(
      keys.map((key) => {
        const defaults = planPricing[key];
        const tier = plans?.[PLAN_KEY_TO_TIER[key]];
        return [
          key,
          {
            label: defaults.label,
            monthly: tier?.MONTHLY?.price ?? defaults.monthly,
            annual: tier?.ANNUAL?.price ?? defaults.annual,
          },
        ];
      }),
    ) as LaunchDialogApi["planPrices"];
  }, [plans]);

  const api = React.useMemo<LaunchDialogApi>(
    () => ({
      openBooking: (classIndex) => {
        setBooking({ name: "", email: "", phone: "" });
        setFormError(null);
        setView({ kind: "booking-details", classIndex });
      },
      openOffer: (offer) => setView({ kind: "offer", offer }),
      openEmailPreview: () => setView({ kind: "email-preview" }),
      selectedPlan,
      setSelectedPlan,
      billingInterval,
      setBillingInterval,
      planPrices,
    }),
    [selectedPlan, billingInterval, planPrices],
  );

  const close = () => setView({ kind: "closed" });

  function handleBookingDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    if (!name || !phone) {
      setFormError("Please enter your name and phone number.");
      return;
    }
    setBooking({ name, email, phone });
    setFormError(null);
    if (view.kind === "booking-details")
      setView({ kind: "booking-review", classIndex: view.classIndex });
  }

  let dialogBody: React.ReactNode = null;

  if (view.kind === "booking-details") {
    const c = sampleClasses[view.classIndex]!;
    dialogBody = (
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-primary">
          Guest booking / demo
        </p>
        <h2 className="display mt-3 text-3xl leading-tight text-[#54355f]">
          A little space for you.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
          {c.name} · {c.price}
          <br />
          {c.date} · {c.mode}
        </p>
        <StepBar step={1} />
        <form className="mt-5 space-y-4" onSubmit={handleBookingDetails}>
          <div>
            <Label htmlFor="booking-name" className="text-[#66516f]">
              Your full name
            </Label>
            <Input
              id="booking-name"
              name="name"
              required
              maxLength={80}
              defaultValue={booking.name}
              placeholder="Your name"
              className="mt-1.5 border-[#e6d8ec] bg-[#fffefa] text-[#785486] placeholder:text-[#b99ac4]"
            />
          </div>
          <div>
            <Label htmlFor="booking-email" className="text-[#66516f]">
              Email address
            </Label>
            <Input
              id="booking-email"
              name="email"
              type="email"
              required
              maxLength={160}
              defaultValue={booking.email}
              placeholder="you@example.com"
              className="mt-1.5 border-[#e6d8ec] bg-[#fffefa] text-[#785486] placeholder:text-[#b99ac4]"
            />
          </div>
          <div>
            <Label htmlFor="booking-phone" className="text-[#66516f]">
              Phone number
            </Label>
            <Input
              id="booking-phone"
              name="phone"
              type="tel"
              required
              maxLength={30}
              defaultValue={booking.phone}
              placeholder="Your phone number"
              className="mt-1.5 border-[#e6d8ec] bg-[#fffefa] text-[#785486] placeholder:text-[#b99ac4]"
            />
          </div>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <Button type="submit" className="w-full bg-[#6355ff] text-white hover:bg-[#5042e5]">
            Continue as a guest <ArrowRight className="size-4" />
          </Button>
        </form>
        <p className="mt-3 text-[11px] text-[#7c6b84]">No Flowboc account required.</p>
        <PreviewWarning />
      </div>
    );
  } else if (view.kind === "booking-review") {
    const c = sampleClasses[view.classIndex]!;
    dialogBody = (
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-primary">
          Guest booking / demo
        </p>
        <h2 className="display mt-3 text-3xl leading-tight text-[#54355f]">
          Your class, at a glance.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
          In the live product, this step leads to the supported payment provider. Here you can
          preview the confirmation without paying.
        </p>
        <StepBar step={2} />
        <dl className="mt-5 divide-y divide-[#e7dfed] text-sm">
          {[
            ["Class", c.name],
            ["When", c.date],
            ["Student", booking.name],
            ["Confirmation email", booking.email],
            ["Example class price", c.price],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[#9a85a2]">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            className="text-sm text-[#89778e] hover:text-[#6b5873]"
            onClick={() => setView({ kind: "booking-details", classIndex: view.classIndex })}
          >
            ← Back
          </button>
          <Button
            className="flex-1 bg-[#6355ff] text-white hover:bg-[#5042e5]"
            onClick={() => setView({ kind: "booking-done", classIndex: view.classIndex })}
          >
            Simulate confirmation <ArrowRight className="size-4" />
          </Button>
        </div>
        <PreviewWarning />
      </div>
    );
  } else if (view.kind === "booking-done") {
    const c = sampleClasses[view.classIndex]!;
    dialogBody = (
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-primary">
          Demo complete
        </p>
        <div className="mt-4 grid size-12 place-items-center rounded-full bg-[#e2f2d5] text-[#6a8c4f]">
          <Check className="size-6" />
        </div>
        <h2 className="display mt-4 text-3xl leading-tight text-[#54355f]">
          That&rsquo;s the guest experience.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
          In Flowboc, a successful paid booking creates a confirmation email for the student and a
          notification for the instructor. No student account is needed.
        </p>
        <StepBar step={3} />
        <dl className="mt-5 divide-y divide-[#e7dfed] text-sm">
          {[
            ["Sample class", c.name],
            ["Booking status", "Preview only · Nothing booked"],
            ["Payment taken", "None"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[#9a85a2]">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <Button asChild className="mt-5 w-full bg-[#6355ff] text-white hover:bg-[#5042e5]">
          <Link href="/auth">
            Build my instructor page <ArrowRight className="size-4" />
          </Link>
        </Button>
        <button
          type="button"
          className="mx-auto mt-3 block text-sm text-[#89778e] hover:text-[#6b5873]"
          onClick={close}
        >
          Back to the wireframe
        </button>
        <PreviewWarning />
      </div>
    );
  } else if (view.kind === "offer") {
    const book = view.offer === "ebook";
    dialogBody = (
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-primary">
          {book ? "Ebook" : "Consultation"} offer / preview
        </p>
        <h2 className="display mt-3 text-3xl leading-tight text-[#54355f]">
          {book ? "The everyday practice." : "A little individual attention."}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
          {book
            ? "An example ebook offer that can sit alongside classes on an instructor's public page."
            : "An example video-call offer that connects a student to the instructor's consultation link."}
        </p>
        <div className="mt-5 rounded-xl border border-[#e9d9f0] bg-[#f5edf9] p-6 text-center">
          <Flower2 className="mx-auto mb-3 size-10 text-primary" />
          <h3 className="display text-2xl text-[#54355f]">
            {book ? "A practice guide by Maya Yoga" : "A consultation with Maya Yoga"}
          </h3>
          <p className="mt-2 text-sm text-[#79677f]">
            {book
              ? "After a successful purchase, the buyer receives a download link."
              : "A free or paid offer. After confirmation, the student receives the instructor's meeting link."}
          </p>
        </div>
        <Button asChild className="mt-5 w-full bg-[#6355ff] text-white hover:bg-[#5042e5]">
          <Link href="/auth">
            Create my own page <ArrowRight className="size-4" />
          </Link>
        </Button>
        <PreviewWarning />
      </div>
    );
  } else if (view.kind === "email-preview") {
    dialogBody = (
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-primary">
          Student update / preview
        </p>
        <h2 className="display mt-3 text-3xl leading-tight text-[#54355f]">A direct connection.</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
          An example of the kind of update an instructor could send through Flowboc&rsquo;s
          newsletter tools.
        </p>
        <div className="mt-5 rounded-xl border border-[#ebdfcf] bg-[#fff8ed] p-6">
          <p className="text-[0.6rem] uppercase tracking-[0.1em] text-[#ae8b9c]">
            From Maya Yoga · Example email
          </p>
          <h3 className="display mt-3 text-2xl text-[#54355f]">A little room for yourself.</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
            Hello,
            <br />
            <br />
            This week&rsquo;s classes are ready. If you have been meaning to make a little time for
            your practice, you are welcome to join us.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
            Morning Flow · Monday, 7:00 AM
            <br />
            Slow down &amp; reset · Wednesday, 6:00 PM
          </p>
          <a
            href="#experience"
            onClick={close}
            className="mt-4 block rounded-lg bg-[#817098] py-2.5 text-center text-sm font-medium text-white"
          >
            Explore this week&rsquo;s classes ↗
          </a>
          <p className="mt-3 text-sm leading-relaxed text-[#79677f]">
            See you on the mat,
            <br />
            Maya
          </p>
        </div>
        <p className="mt-4 text-[11px] text-[#b899c4]">
          This is an illustrative email. Nothing is sent, and no subscription is created.
        </p>
      </div>
    );
  }

  return (
    <LaunchDialogCtx.Provider value={api}>
      {children}
      <Dialog open={view.kind !== "closed"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-[23px] border-[#ddd1e7] bg-[#fffdf8] p-8">
          {dialogBody}
        </DialogContent>
      </Dialog>
    </LaunchDialogCtx.Provider>
  );
}
