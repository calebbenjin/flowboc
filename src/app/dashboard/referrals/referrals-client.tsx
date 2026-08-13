"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { money, referralProgram, referralStats, referrals, type ReferralStatus } from "@/lib/demo";

function statusTone(status: ReferralStatus) {
  if (status === "active") return "good" as const;
  if (status === "pending") return "warn" as const;
  return "neutral" as const;
}

export function ReferralsClient() {
  const [copied, setCopied] = useState(false);
  const referralUrl = `https://${referralProgram.link}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Referrals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn {referralProgram.commissionRate}% commission on every subscription you refer.
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
          <Button size="sm" variant="clay" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Code: <span className="font-medium text-foreground">{referralProgram.code}</span> · Share
          this link with instructors — when they subscribe, you earn{" "}
          {referralProgram.commissionRate}% of their subscription, every billing cycle.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Instructors referred", value: referralStats.totalReferred },
          { label: "Active referrals", value: referralStats.activeReferrals },
          { label: "Commission earned", value: money(referralStats.totalCommission) },
        ].map((s) => (
          <div key={s.label} className="surface p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="display mt-2 text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

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
                  {r.plan} plan · joined {r.joinedAt}
                </p>
              </div>
              <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill>
              <div className="w-28 text-right">
                <p className="font-medium">{money(r.commissionEarned)}</p>
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
