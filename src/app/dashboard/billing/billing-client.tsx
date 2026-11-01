"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Star,
  XCircle,
  Flower2,
  Sprout,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import styles from "./billing.module.css";
import { starterFeatures, proFeatures } from "@/lib/plan-features";
import { OnboardingDesignOffer } from "./OnboardingDesignOffer";
import type { OnboardingMood } from "@/lib/onboarding-appearance";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { useInstructor } from "@/components/InstructorProvider";
import { money } from "@/lib/demo";
import { isTrialExpired } from "@/lib/trial";
import { cn } from "@/lib/utils";
import { startSubscription, cancelSubscription, refreshBillingStatus } from "./actions";
import type { BillingInterval, PlanTier } from "@/generated/prisma/enums";

const DAY_MS = 24 * 60 * 60 * 1000;

type PlanInfo = { price: number; planCode: string } | null;

const TIERS = ["STARTER", "PRO"] as const;
const TIER_LABEL: Record<PlanTier, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  PREMIUM: "Premium",
};

const TIER_RECOMMENDED: Partial<Record<PlanTier, true>> = { PRO: true };
const TIER_FEATURES = { STARTER: starterFeatures, PRO: proFeatures };

// Set in sessionStorage right before redirecting to Startbutton's hosted
// checkout, and checked for on return. Startbutton's subscription endpoint
// doesn't confirm it appends a query param to its redirect the way
// Paystack's callback_url did, so this can't depend on the URL — it only
// depends on the instructor's browser coming back to this page at all.
const SUBSCRIBING_FLAG = "flowboc:subscribing";
// The plan code being checked out — stored alongside SUBSCRIBING_FLAG so
// the post-redirect poll can detect "the specific new plan's charge
// landed" rather than just "planStatus is ACTIVE", which for a plan
// *switch* (already ACTIVE before redirecting) is true on the very first
// poll tick regardless of whether the new charge has actually confirmed.
const TARGET_PLAN_CODE = "flowboc:subscribing:planCode";

export function BillingClient({
  plans,
  onboardingMood = null,
}: {
  plans: Record<PlanTier, Record<BillingInterval, PlanInfo>>;
  onboardingMood?: OnboardingMood | null;
}) {
  const router = useRouter();
  const instructor = useInstructor();
  const isActive = instructor.planStatus === "ACTIVE";
  const [tier, setTier] = useState<PlanTier>(
    onboardingMood || instructor.planTier === "PREMIUM" ? "PRO" : instructor.planTier,
  );
  const [interval, setInterval] = useState<BillingInterval>(
    instructor.billingInterval ?? "MONTHLY",
  );
  const [starting, setStarting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const activating = useRef(false);

  const tierPlans = plans[tier];
  const selectedPlan = tierPlans[interval];
  const isCurrentPlan =
    isActive && instructor.planTier === tier && instructor.billingInterval === interval;

  // Shown as a "Save X%" badge on the Annual toggle for the selected tier —
  // purely informational, doesn't affect which plan ends up selected.
  const annualSavingsPct = (() => {
    const m = tierPlans.MONTHLY?.price;
    const a = tierPlans.ANNUAL?.price;
    if (!m || !a || a >= m) return null;
    return Math.round((1 - a / m) * 100);
  })();

  // Poll briefly for the Startbutton webhook to land rather than leave the
  // page showing a stale state after a checkout redirect back. Compares
  // subscriptionPlanCode (not just planStatus) so a plan switch — already
  // ACTIVE before redirecting — waits for the specific new charge, not just
  // "still active from the old plan".
  useEffect(() => {
    const targetPlanCode = window.sessionStorage.getItem(TARGET_PLAN_CODE);
    if (!window.sessionStorage.getItem(SUBSCRIBING_FLAG) || activating.current) return;
    activating.current = true;
    window.sessionStorage.removeItem(SUBSCRIBING_FLAG);
    window.sessionStorage.removeItem(TARGET_PLAN_CODE);
    toast.success("Checking for your payment — activating your subscription…");

    let attempts = 0;
    const id = window.setInterval(() => {
      attempts += 1;
      void refreshBillingStatus().then((result) => {
        const landed = targetPlanCode
          ? result.subscriptionPlanCode === targetPlanCode
          : result.planStatus === "ACTIVE";
        if (landed || attempts >= 6) {
          window.clearInterval(id);
          router.refresh();
        }
      });
    }, 2000);

    return () => window.clearInterval(id);
  }, [router]);

  async function handleSubscribe() {
    if (!selectedPlan) return;
    setStarting(true);
    try {
      const result = await startSubscription(tier, interval);
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture(
            isActive ? "subscription_plan_switch_started" : "subscription_checkout_started",
            {
              billing_interval: interval.toLowerCase(),
              plan_tier: tier.toLowerCase(),
            },
          );
        }
        window.sessionStorage.setItem(SUBSCRIBING_FLAG, "1");
        window.sessionStorage.setItem(TARGET_PLAN_CODE, selectedPlan.planCode);
        window.location.href = result.authorizationUrl;
      } else {
        toast.error(result.error);
        setStarting(false);
      }
    } catch {
      toast.error("Couldn't start checkout. Please try again.");
      setStarting(false);
    }
  }

  async function handleCancel() {
    setCanceling(true);
    try {
      const result = await cancelSubscription();
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("subscription_cancelled");
        }
        toast.success("Subscription canceled");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setCanceling(false);
    }
  }

  const trialDaysLeft = instructor.trialEndsAt
    ? Math.max(0, Math.ceil((instructor.trialEndsAt.getTime() - Date.now()) / DAY_MS))
    : null;

  return (
    <DashboardShell>
      <div className={styles["page"]}>
        <header className={styles["header"]}>
          <div>
            <p className={styles["eyebrow"]}>Room for your next chapter</p>
            <h1>Billing</h1>
          </div>
          <Link href="/dashboard/payouts">
            Manage payouts <ArrowUpRight size={16} />
          </Link>
        </header>
        <section className={styles["overview"]} aria-label="Your Flowboc plan">
          <div className={styles["intro"]}>
            <Flower2 size={30} strokeWidth={1.3} aria-hidden="true" />
            <h2>
              A plan for
              <br />
              <em>your kind of growth.</em>
            </h2>
            <p>
              Make space for your teaching. Keep your plan, billing details, and next steps together
              here.
            </p>
          </div>
          <div className={styles["current"]}>
            <span className={styles["planLabel"]}>Your current plan</span>
            <div className={styles["planName"]}>
              <h3>Flowboc {TIER_LABEL[instructor.planTier]}</h3>
              <span>
                <Sprout size={25} strokeWidth={1.3} />
              </span>
            </div>
            <StatusHeader instructor={instructor} trialDaysLeft={trialDaysLeft} />
            <div className={styles["planMeta"]}>
              <span>
                {instructor.planStatus === "COMPED"
                  ? "Complimentary access"
                  : instructor.billingInterval === "ANNUAL"
                    ? "Annual billing"
                    : instructor.billingInterval === "MONTHLY"
                      ? "Monthly billing"
                      : "Choose your billing below"}
              </span>
              {instructor.planStatus === "ACTIVE" && instructor.subscriptionRenewsAt && (
                <span>Renews {instructor.subscriptionRenewsAt.toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </section>

        <OnboardingDesignOffer initialMood={onboardingMood} />

        <div className={styles["billing"]}>
          {(isActive ||
            instructor.planStatus === "TRIALING" ||
            instructor.planStatus === "CANCELED" ||
            instructor.planStatus === "PAST_DUE" ||
            (instructor.planStatus === "COMPED" &&
              instructor.compedUntil !== null &&
              instructor.compedUntil.getTime() < Date.now())) && (
            <div className={styles["chooser"]}>
              <div className={styles["chooserHeading"]}>
                <h2>{isActive ? "Find your next fit" : "Choose your space to grow"}</h2>
                <p>Compare your options and choose the rhythm that suits your teaching.</p>
              </div>

              <div className={styles["interval"]}>
                <div className={styles["intervalInner"]}>
                  {(["MONTHLY", "ANNUAL"] as const).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInterval(i)}
                      aria-pressed={interval === i}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                        interval === i
                          ? "bg-clay text-clay-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {i === "MONTHLY" ? "Monthly" : "Annual"}
                      {i === "ANNUAL" && annualSavingsPct ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                            interval === "ANNUAL"
                              ? "bg-white/20 text-clay-foreground"
                              : "bg-success/15 text-success",
                          )}
                        >
                          Save {annualSavingsPct}%
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles["plans"]}>
                {TIERS.map((t) => {
                  const plan = plans[t][interval];
                  const selected = tier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      aria-pressed={selected}
                      data-selected={selected}
                      data-tier={t}
                      className={cn(
                        styles["plan"],
                        selected
                          ? "border-2 border-clay bg-clay/5"
                          : "border-border hover:border-clay/40",
                      )}
                    >
                      {TIER_RECOMMENDED[t] && (
                        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-clay bg-card px-2.5 py-0.5 text-[0.65rem] font-bold text-clay shadow-sm">
                          <Star className="size-3 fill-current" /> Recommended
                        </span>
                      )}
                      <span className={styles["tierIcon"]}>
                        {t === "STARTER" ? (
                          <Sprout size={22} strokeWidth={1.4} />
                        ) : (
                          <Flower2 size={22} strokeWidth={1.4} />
                        )}
                      </span>
                      <p className="font-semibold">{TIER_LABEL[t]}</p>
                      <span className={styles["tierNote"]}>
                        {t === "STARTER"
                          ? "Begin your teaching journey"
                          : t === "PRO"
                            ? "More ways to grow your practice"
                            : "For a wider teaching community"}
                      </span>
                      <p className="mt-2">
                        {plan ? (
                          <>
                            <span className="text-2xl font-extrabold">
                              {money(plan.price, "USD")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /{interval === "MONTHLY" ? "mo" : "yr"}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unavailable</span>
                        )}
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {TIER_FEATURES[t].map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                          >
                            <Check className="mt-0.5 size-3 shrink-0 text-clay" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {tierPlans.MONTHLY || tierPlans.ANNUAL ? (
                <>
                  <Button
                    variant="clay"
                    className={styles["subscribe"]}
                    disabled={!selectedPlan || starting || isCurrentPlan}
                    onClick={() => void handleSubscribe()}
                  >
                    {starting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Redirecting…
                      </>
                    ) : isCurrentPlan ? (
                      "Your current plan"
                    ) : isActive ? (
                      `Switch to ${TIER_LABEL[tier]}`
                    ) : (
                      "Subscribe with card"
                    )}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isActive && !isCurrentPlan
                      ? `Starts a new ${TIER_LABEL[tier]} subscription and cancels your current one once the new charge confirms — no overlap in billing.`
                      : "Paid by card only, so your subscription can auto-renew each billing cycle."}{" "}
                    Use the email on your Flowboc account ({instructor.email}) at checkout so we can
                    match the payment back to your account.
                  </p>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  {TIER_LABEL[tier]} isn&apos;t available yet.
                </p>
              )}
            </div>
          )}

          {instructor.planStatus === "ACTIVE" && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <div className="text-sm text-muted-foreground">
                {instructor.subscriptionRenewsAt &&
                  `Renews ${instructor.subscriptionRenewsAt.toLocaleDateString()} · ${
                    instructor.billingInterval === "ANNUAL" ? "Annual" : "Monthly"
                  }`}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={canceling}
                onClick={() => void handleCancel()}
              >
                {canceling ? <Loader2 className="size-4 animate-spin" /> : "Cancel subscription"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function StatusHeader({
  instructor,
  trialDaysLeft,
}: {
  instructor: ReturnType<typeof useInstructor>;
  trialDaysLeft: number | null;
}) {
  if (instructor.planStatus === "ACTIVE") {
    return (
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <p className="font-medium">Active</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your subscription is active — publishing and bookings stay on.
          </p>
        </div>
      </div>
    );
  }

  if (instructor.planStatus === "PAST_DUE") {
    return (
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <p className="font-medium">Payment failed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your last renewal didn&apos;t go through. Resubscribe below with a working card to
            restore billing.
          </p>
        </div>
      </div>
    );
  }

  if (instructor.planStatus === "CANCELED") {
    return (
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
          <XCircle className="size-5" />
        </span>
        <div>
          <p className="font-medium">Canceled</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Publishing new classes and new bookings are paused until you subscribe again.
          </p>
        </div>
      </div>
    );
  }

  if (instructor.planStatus === "COMPED") {
    const lapsed = instructor.compedUntil !== null && instructor.compedUntil.getTime() < Date.now();
    return (
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full",
            lapsed ? "bg-destructive/10 text-destructive" : "bg-[#eeebff] text-[#6355ff]",
          )}
        >
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <p className="font-medium">
            {lapsed ? "Complimentary access ended" : "Complimentary access"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lapsed
              ? "Your comp period has ended. Publishing and bookings are paused until you subscribe."
              : instructor.compedUntil
                ? `Free access until ${instructor.compedUntil.toLocaleDateString()}.`
                : "You have indefinite free access — no card needed."}
            {instructor.compNote ? ` (${instructor.compNote})` : ""}
          </p>
        </div>
      </div>
    );
  }

  const expired = isTrialExpired(instructor);
  return (
    <div className="flex items-center gap-4">
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-full",
          expired ? "bg-destructive/10 text-destructive" : "bg-clay/12 text-clay",
        )}
      >
        <Clock className="size-5" />
      </span>
      <div>
        <p className="font-medium">
          {expired
            ? "Trial ended"
            : trialDaysLeft !== null
              ? `${trialDaysLeft}-day trial`
              : "Trial"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {expired
            ? "Publishing new classes and new bookings are paused until you subscribe."
            : "Subscribe any time before your trial ends to keep your booking page live."}
        </p>
      </div>
    </div>
  );
}
