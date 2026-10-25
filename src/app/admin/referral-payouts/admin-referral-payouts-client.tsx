"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusPill";
import { money } from "@/lib/demo";
import { adminApproveReferralPayout, adminRejectReferralPayout } from "./actions";
import type { AdminReferralPayoutRow } from "./queries";
import type { ReferralPayoutStatus } from "@/generated/prisma/enums";

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "PAID", "REJECTED", "FAILED"] as const;

function statusTone(status: ReferralPayoutStatus) {
  if (status === "PAID") return "good" as const;
  if (status === "PENDING" || status === "APPROVED") return "warn" as const;
  if (status === "REJECTED" || status === "FAILED") return "bad" as const;
  return "neutral" as const;
}

export function AdminReferralPayoutsClient({ requests }: { requests: AdminReferralPayoutRow[] }) {
  const [list, setList] = useState(requests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  const [reviewTarget, setReviewTarget] = useState<AdminReferralPayoutRow | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [reviewPending, setReviewPending] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.instructorName.toLowerCase().includes(q) || r.instructorEmail.toLowerCase().includes(q)
      );
    });
  }, [list, search, statusFilter]);

  function patch(id: string, data: Partial<AdminReferralPayoutRow>) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }

  async function handleApprove() {
    if (!reviewTarget) return;
    setReviewPending(true);
    try {
      const result = await adminApproveReferralPayout(reviewTarget.id);
      if (result.ok) {
        toast.success(`Transfer initiated for ${reviewTarget.instructorName}`);
        patch(reviewTarget.id, { status: "APPROVED", reviewedAt: new Date() });
        setReviewTarget(null);
      } else {
        toast.error(result.error);
      }
    } finally {
      setReviewPending(false);
    }
  }

  async function handleReject() {
    if (!reviewTarget) return;
    setReviewPending(true);
    try {
      const result = await adminRejectReferralPayout(reviewTarget.id, rejectNote);
      if (result.ok) {
        toast.success(`Rejected ${reviewTarget.instructorName}'s payout request`);
        patch(reviewTarget.id, { status: "REJECTED", reviewedAt: new Date() });
        setReviewTarget(null);
      } else {
        toast.error(result.error);
      }
    } finally {
      setReviewPending(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl">Referral payouts admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} payout request{list.length === 1 ? "" : "s"} total · approving transfers the
          amount into the instructor&apos;s connected Paystack subaccount.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total requests", value: list.length },
          { label: "Awaiting review", value: list.filter((r) => r.status === "PENDING").length },
          { label: "Paid out", value: list.filter((r) => r.status === "PAID").length },
        ].map((s) => (
          <div key={s.label} className="surface bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="display mt-2 text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by instructor name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="surface mt-4 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Payout account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.instructorName}</p>
                  <p className="text-xs text-muted-foreground">{r.instructorEmail}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.payoutBankLabel ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusPill tone={statusTone(r.status)}>{r.status.toLowerCase()}</StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  {money(r.amount, r.instructorCurrency)}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "PENDING" ? (
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        setReviewTarget(r);
                        setRejectNote("");
                      }}
                    >
                      Review
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {r.reviewedAt ? r.reviewedAt.toLocaleDateString() : "—"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No payout requests match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={reviewTarget !== null} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Review payout request</DialogTitle>
            <DialogDescription>
              {reviewTarget?.instructorName} ·{" "}
              {money(reviewTarget?.amount ?? 0, reviewTarget?.instructorCurrency ?? "NGN")}
              {reviewTarget?.payoutBankLabel ? ` → ${reviewTarget.payoutBankLabel}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-note">Note (shown only on rejection)</Label>
            <Input
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Optional reason…"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={reviewPending} onClick={() => void handleReject()}>
              {reviewPending ? <Loader2 className="size-4 animate-spin" /> : "Reject"}
            </Button>
            <Button variant="clay" disabled={reviewPending} onClick={() => void handleApprove()}>
              {reviewPending ? <Loader2 className="size-4 animate-spin" /> : "Approve & pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
