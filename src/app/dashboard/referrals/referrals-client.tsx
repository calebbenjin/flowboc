"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Loader2,
  Flower2,
  Sprout,
  HeartHandshake,
  ArrowUpRight,
  Link2,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/demo";
import { siteUrl } from "@/lib/site";
import type { ReferralPayoutStatus, ReferralStatus } from "@/generated/prisma/enums";
import { requestReferralPayout } from "./actions";
import type { PayoutRequestRow, ReferralRow } from "./queries";
import styles from "./referrals.module.css";

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
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn’t copy the link. Select and copy it below.");
    }
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
      <div className={styles["page"]}>
        <header className={styles["header"]}>
          <div>
            <p className={styles["eyebrow"]}>Good things grow together</p>
            <h1>Referrals</h1>
          </div>
          <Link href="/referral-program">
            How it works <ArrowUpRight size={16} />
          </Link>
        </header>
        <section className={styles["hero"]} aria-label="Invite an instructor">
          <div className={styles["intro"]}>
            <HeartHandshake size={30} strokeWidth={1.4} aria-hidden="true" />
            <h2>
              Share the space.
              <br />
              <em>Grow together.</em>
            </h2>
            <p>
              Know a teacher who would feel at home here? Invite them to Flowboc and earn a one-time
              bonus when they subscribe.
            </p>
            <div className={styles["reward"]}>
              <strong>
                {instructor.commissionRate}
                <span>%</span>
              </strong>
              <div>
                For a new beginning<small>of their first subscription payment</small>
              </div>
              <Flower2 size={48} strokeWidth={0.9} aria-hidden="true" />
            </div>
          </div>
          <div className={styles["share"]}>
            <span className={styles["shareIcon"]}>
              <Link2 size={23} strokeWidth={1.5} />
            </span>
            <h3>Your invitation starts here</h3>
            <p>One link. A new teacher in your circle.</p>
            <label htmlFor="referral-link">Your personal referral link</label>
            <input
              id="referral-link"
              value={referralUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <button className={styles["copy"]} onClick={() => void handleCopy()}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? "Link copied — ready to share" : "Copy my invitation link"}
            </button>
            <span className={styles["code"]}>
              Your code <strong>{instructor.referralCode}</strong>
            </span>
            <p className={styles["hint"]}>
              Send it to a fellow instructor or share it with your teaching community.
            </p>
            <span className="sr-only" role="status">
              {copied ? "Referral link copied" : ""}
            </span>
          </div>
        </section>
        <ol className={styles["steps"]}>
          {[
            {
              Icon: Link2,
              title: "Share your link",
              body: "Invite a fellow instructor to join Flowboc.",
            },
            {
              Icon: Sprout,
              title: "They subscribe",
              body: "They sign up through your link and make their first payment.",
            },
            {
              Icon: Flower2,
              title: "You earn a thank-you",
              body: `Receive a ${instructor.commissionRate}% one-time bonus on that first payment.`,
            },
          ].map(({ Icon, title, body }, index) => (
            <li key={title}>
              <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles["stats"]}>
          {[
            { label: "Instructors referred", value: stats.totalReferred },
            { label: "Active referrals", value: stats.activeReferrals },
            {
              label: "Commission earned",
              value: money(stats.totalCommission, instructor.currency),
            },
          ].map((s) => (
            <div key={s.label} className={styles["stat"]}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="display mt-2 text-3xl">{s.value}</p>
            </div>
          ))}
        </div>

        <div className={styles["balance"]}>
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
                    <p className="font-medium">{money(r.amount, r.currency)}</p>
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
                  <p className="font-medium">
                    {r.commissionPending
                      ? "Converting…"
                      : money(r.commissionEarned, r.commissionCurrency ?? instructor.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">earned</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles["empty"]}>
            <span>
              <HeartHandshake size={28} strokeWidth={1.3} />
            </span>
            <h3>Every circle starts with an invitation.</h3>
            <p>
              Your referred instructors will appear here after they join. Share your link with
              someone you’d love to see teaching on Flowboc.
            </p>
            <button onClick={() => void handleCopy()}>
              {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
              {copied ? "Invitation link copied" : "Copy your invitation"}
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
