"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/demo";
import { siteUrl } from "@/lib/site";
import type { ReferralPayoutStatus, ReferralStatus } from "@/generated/prisma/enums";
import { requestReferralPayout } from "./actions";
import type { PayoutRequestRow, ReferralRow } from "./queries";

function statusTone(status: ReferralStatus) {
  if (status === "ACTIVE") return "good" as const;
  if (status === "PENDING") return "warn" as const;
  return "neutral" as const;
}

function payoutStatusTone(status: ReferralPayoutStatus) {
  if (status === "PAID") return "good" as const;
  if (status === "PENDING" || status === "APPROVED") return "warn" as const;
  if (status === "REJECTED" || status === "FAILED") return "bad" as const;
  return "neutral" as const;
}

function payoutStatusLabel(status: ReferralPayoutStatus) {
  if (status === "PENDING") return "pending review";
  if (status === "APPROVED") return "approved · sending";
  return status.toLowerCase();
}

export function ReferralsClient({
  referrals,
  stats,
  availableBalance,
  payoutRequests,
}: {
  referrals: ReferralRow[];
  stats: { totalReferred: number; activeReferrals: number; totalCommission: number };
  availableBalance: number;
  payoutRequests: PayoutRequestRow[];
}) {
  const instructor = useInstructor();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const referralUrl = `${siteUrl}/r/${instructor.referralCode}`;

  const hasRequestInFlight = payoutRequests.some(
    (r) => r.status === "PENDING" || r.status === "APPROVED",
  );
  const payoutConnected = instructor.payoutStatus === "CONNECTED" && !!instructor.payoutAccountId;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRequestPayout() {
    setRequesting(true);
    try {
      const result = await requestReferralPayout();
      if (result.ok) {
        toast.success("Payout requested — we'll review it shortly.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn't request a payout. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Referrals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn a {instructor.commissionRate}% one-time bonus for every instructor you refer who
            subscribes.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/referral-program">How it works</Link>
        </Button>
      </div>

      <div className="surface mt-6 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Your referral link</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm">
            <span className="truncate">{referralUrl}</span>
          </div>
          <Button size="sm" variant="clay" onClick={() => void handleCopy()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Code: <span className="font-medium text-foreground">{instructor.referralCode}</span> ·
          Share this link with instructors — when they subscribe, you earn a one-time bonus of{" "}
          {instructor.commissionRate}% of their first payment.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Instructors referred", value: stats.totalReferred },
          { label: "Active referrals", value: stats.activeReferrals },
          { label: "Commission earned", value: money(stats.totalCommission, instructor.currency) },
        ].map((s) => (
          <div key={s.label} className="surface p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="display mt-2 text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="surface mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Available to withdraw
          </p>
          <p className="display mt-2 text-3xl">{money(availableBalance, instructor.currency)}</p>
          {!payoutConnected && (
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href="/dashboard/payouts" className="underline">
                Connect your payout account
              </Link>{" "}
              to request a payout.
            </p>
          )}
        </div>
        {hasRequestInFlight ? (
          <StatusPill tone="warn">Payout request in progress</StatusPill>
        ) : (
          <Button
            variant="clay"
            disabled={!payoutConnected || availableBalance <= 0 || requesting}
            onClick={() => void handleRequestPayout()}
          >
            {requesting ? <Loader2 className="size-4 animate-spin" /> : "Request payout"}
          </Button>
        )}
      </div>

      {payoutRequests.length > 0 && (
        <>
          <h2 className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Payout requests
          </h2>
          <div className="surface mt-3 divide-y divide-border">
            {payoutRequests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{money(r.amount, instructor.currency)}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested {r.requestedAt.toLocaleDateString()}
                    {r.status === "FAILED" && r.failureReason ? ` · ${r.failureReason}` : ""}
                  </p>
                </div>
                <StatusPill tone={payoutStatusTone(r.status)}>
                  {payoutStatusLabel(r.status)}
                </StatusPill>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Your referrals
      </h2>
      {referrals.length > 0 ? (
        <div className="surface mt-3 divide-y divide-border">
          {referrals.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-muted-foreground">
                  {r.plan ? `${r.plan} plan · ` : ""}joined {r.joinedAt.toLocaleDateString()}
                </p>
              </div>
              <StatusPill tone={statusTone(r.status)}>{r.status.toLowerCase()}</StatusPill>
              <div className="w-28 text-right">
                <p className="font-medium">{money(r.commissionEarned, instructor.currency)}</p>
                <p className="text-xs text-muted-foreground">earned</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface mt-3 p-6 text-center text-sm text-muted-foreground">
          No referrals yet. Share your link to start earning.
        </div>
      )}
    </DashboardShell>
  );
}
