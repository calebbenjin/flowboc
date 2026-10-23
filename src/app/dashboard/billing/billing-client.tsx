"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
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

const TIERS: PlanTier[] = ["STARTER", "PRO", "PREMIUM"];
const TIER_LABEL: Record<PlanTier, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  PREMIUM: "Premium",
};

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
}: {
  plans: Record<PlanTier, Record<BillingInterval, PlanInfo>>;
}) {
  const router = useRouter();
  const instructor = useInstructor();
  const isActive = instructor.planStatus === "ACTIVE";
  const [tier, setTier] = useState<PlanTier>(instructor.planTier);
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
      <div>
        <h1 className="text-3xl">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your Flowboc subscription.</p>
      </div>

      <div className="surface mt-6 p-6">
        <StatusHeader instructor={instructor} trialDaysLeft={trialDaysLeft} />

        {(isActive ||
          instructor.planStatus === "TRIALING" ||
          instructor.planStatus === "CANCELED" ||
          instructor.planStatus === "PAST_DUE" ||
          (instructor.planStatus === "COMPED" &&
            instructor.compedUntil !== null &&
            instructor.compedUntil.getTime() < Date.now())) && (
          <div className="mt-6 border-t border-border pt-6">
            {isActive && <p className="mb-3 text-sm font-medium">Change plan</p>}
            <div className="flex gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    tier === t
                      ? "border-clay bg-clay/5 text-clay"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {TIER_LABEL[t]}
                </button>
              ))}
            </div>

            {tierPlans.MONTHLY || tierPlans.ANNUAL ? (
              <>
                <div className="mt-3 flex gap-2">
                  {(["MONTHLY", "ANNUAL"] as const).map((i) => {
                    const plan = tierPlans[i];
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!plan}
                        onClick={() => setInterval(i)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          interval === i
                            ? "border-clay bg-clay/5 text-clay"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {plan
                          ? `${i === "MONTHLY" ? "Monthly" : "Annual"} — ${money(plan.price, instructor.currency)}/${i === "MONTHLY" ? "mo" : "yr"}`
                          : `${i === "MONTHLY" ? "Monthly" : "Annual"} — unavailable`}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="clay"
                  className="mt-4 w-full sm:w-auto"
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
              <p className="mt-3 text-sm text-muted-foreground">
                {TIER_LABEL[tier]} isn&apos;t available in {instructor.currency} yet.
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
            lapsed ? "bg-destructive/10 text-destructive" : "bg-blue-500/10 text-blue-600",
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
