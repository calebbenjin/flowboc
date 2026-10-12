"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { adminCancelSubscription, adminGrantComp, adminExtendTrial } from "./actions";
import type { BillingInterval, CurrencyCode, PlanStatus } from "@/generated/prisma/enums";

type Instructor = {
  id: string;
  name: string;
  slug: string;
  email: string;
  currency: CurrencyCode;
  planStatus: PlanStatus;
  trialEndsAt: Date | null;
  compedUntil: Date | null;
  compNote: string | null;
  billingInterval: BillingInterval | null;
  subscriptionRenewsAt: Date | null;
  subscriptionProviderId: string | null;
};

const STATUS_FILTERS = ["ALL", "TRIALING", "ACTIVE", "PAST_DUE", "COMPED", "CANCELED"] as const;

function StatusBadge({ status }: { status: PlanStatus }) {
  const styles: Record<PlanStatus, string> = {
    TRIALING: "bg-clay/12 text-clay",
    ACTIVE: "bg-success/15 text-success",
    PAST_DUE: "bg-destructive/10 text-destructive",
    COMPED: "bg-blue-500/10 text-blue-600",
    CANCELED: "bg-secondary text-muted-foreground",
  };
  const labels: Record<PlanStatus, string> = {
    TRIALING: "Trialing",
    ACTIVE: "Active",
    PAST_DUE: "Past due",
    COMPED: "Comped",
    CANCELED: "Canceled",
  };
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

const COMP_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "Indefinite", days: null },
] as const;

export function AdminBillingClient({ instructors }: { instructors: Instructor[] }) {
  const [list, setList] = useState(instructors);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  const [compTarget, setCompTarget] = useState<Instructor | null>(null);
  const [compDays, setCompDays] = useState<number | null>(30);
  const [compNote, setCompNote] = useState("");
  const [compPending, setCompPending] = useState(false);

  const [trialTarget, setTrialTarget] = useState<Instructor | null>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [trialPending, setTrialPending] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Instructor | null>(null);
  const [cancelPending, setCancelPending] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((i) => {
      if (statusFilter !== "ALL" && i.planStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q)
      );
    });
  }, [list, search, statusFilter]);

  function patch(id: string, data: Partial<Instructor>) {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  }

  async function handleGrantComp() {
    if (!compTarget) return;
    setCompPending(true);
    try {
      const result = await adminGrantComp({
        instructorId: compTarget.id,
        days: compDays,
        note: compNote,
      });
      if (result.ok) {
        toast.success(`Comp access granted to ${compTarget.name}`);
        patch(compTarget.id, {
          planStatus: "COMPED",
          compedUntil: compDays !== null ? new Date(Date.now() + compDays * 86_400_000) : null,
          compNote: compNote.trim() || null,
        });
        setCompTarget(null);
        setCompNote("");
      } else {
        toast.error(result.error);
      }
    } finally {
      setCompPending(false);
    }
  }

  async function handleExtendTrial() {
    if (!trialTarget) return;
    setTrialPending(true);
    try {
      const result = await adminExtendTrial({ instructorId: trialTarget.id, days: trialDays });
      if (result.ok) {
        toast.success(`Trial extended for ${trialTarget.name}`);
        patch(trialTarget.id, {
          planStatus: "TRIALING",
          trialEndsAt: new Date(Date.now() + trialDays * 86_400_000),
        });
        setTrialTarget(null);
      } else {
        toast.error(result.error);
      }
    } finally {
      setTrialPending(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelPending(true);
    try {
      const result = await adminCancelSubscription(cancelTarget.id);
      if (result.ok) {
        toast.success(`Subscription canceled for ${cancelTarget.name}`);
        patch(cancelTarget.id, { planStatus: "CANCELED" });
        setCancelTarget(null);
      } else {
        toast.error(result.error);
      }
    } finally {
      setCancelPending(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl">Billing admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} instructor{list.length === 1 ? "" : "s"} total.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search name, email, or slug…"
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

      <div className="surface mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.email}</p>
                </TableCell>
                <TableCell>{i.currency}</TableCell>
                <TableCell>
                  <StatusBadge status={i.planStatus} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {i.planStatus === "TRIALING" &&
                    i.trialEndsAt &&
                    `Trial ends ${i.trialEndsAt.toLocaleDateString()}`}
                  {i.planStatus === "COMPED" && (
                    <>
                      {i.compedUntil ? `Until ${i.compedUntil.toLocaleDateString()}` : "Indefinite"}
                      {i.compNote ? ` — ${i.compNote}` : ""}
                    </>
                  )}
                  {i.planStatus === "ACTIVE" &&
                    i.subscriptionRenewsAt &&
                    `Renews ${i.subscriptionRenewsAt.toLocaleDateString()} (${
                      i.billingInterval === "ANNUAL" ? "annual" : "monthly"
                    })`}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        setTrialTarget(i);
                        setTrialDays(14);
                      }}
                    >
                      Extend trial
                    </Button>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        setCompTarget(i);
                        setCompDays(30);
                        setCompNote(i.compNote ?? "");
                      }}
                    >
                      Grant comp
                    </Button>
                    {(i.planStatus === "ACTIVE" || i.planStatus === "PAST_DUE") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCancelTarget(i)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No instructors match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={compTarget !== null} onOpenChange={(open) => !open && setCompTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant comp access</DialogTitle>
            <DialogDescription>
              {compTarget?.name} gets free access without a real Paystack subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            {COMP_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setCompDays(p.days)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                  compDays === p.days
                    ? "border-clay bg-clay/5 text-clay"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comp-note">Note (optional)</Label>
            <Textarea
              id="comp-note"
              value={compNote}
              onChange={(e) => setCompNote(e.target.value)}
              placeholder="e.g. 1-month launch promo"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button variant="clay" disabled={compPending} onClick={() => void handleGrantComp()}>
              {compPending ? <Loader2 className="size-4 animate-spin" /> : "Grant comp access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={trialTarget !== null} onOpenChange={(open) => !open && setTrialTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extend trial</DialogTitle>
            <DialogDescription>
              Resets {trialTarget?.name}&apos;s trial to start counting down from today.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="trial-days">Days from today</Label>
            <Input
              id="trial-days"
              type="number"
              min={1}
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value) || 1)}
            />
          </div>

          <DialogFooter>
            <Button variant="clay" disabled={trialPending} onClick={() => void handleExtendTrial()}>
              {trialPending ? <Loader2 className="size-4 animate-spin" /> : "Extend trial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {cancelTarget?.name}&apos;s subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.subscriptionProviderId
                ? "This disables their live Startbutton subscription and blocks publishing/bookings immediately."
                : "This blocks publishing/bookings immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Never mind
            </Button>
            <Button
              variant="destructive"
              disabled={cancelPending}
              onClick={() => void handleCancel()}
            >
              {cancelPending ? <Loader2 className="size-4 animate-spin" /> : "Cancel subscription"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
