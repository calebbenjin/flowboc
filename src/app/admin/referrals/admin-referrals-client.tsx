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
import { adminAdjustReferral } from "./actions";
import type { AdminReferralRow } from "./queries";
import type { ReferralStatus } from "@/generated/prisma/enums";

const STATUS_FILTERS = ["ALL", "PENDING", "ACTIVE", "CHURNED"] as const;

function statusTone(status: ReferralStatus) {
  if (status === "ACTIVE") return "good" as const;
  if (status === "PENDING") return "warn" as const;
  return "neutral" as const;
}

export function AdminReferralsClient({ referrals }: { referrals: AdminReferralRow[] }) {
  const [list, setList] = useState(referrals);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  const [editTarget, setEditTarget] = useState<AdminReferralRow | null>(null);
  const [editStatus, setEditStatus] = useState<ReferralStatus>("PENDING");
  const [editCommission, setEditCommission] = useState("0");
  const [editPending, setEditPending] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.referrerName.toLowerCase().includes(q) ||
        r.referrerEmail.toLowerCase().includes(q) ||
        r.referredName.toLowerCase().includes(q) ||
        r.referredEmail.toLowerCase().includes(q)
      );
    });
  }, [list, search, statusFilter]);

  function patch(id: string, data: Partial<AdminReferralRow>) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }

  async function handleSave() {
    if (!editTarget) return;
    const commissionEarned = Number(editCommission);
    setEditPending(true);
    try {
      const result = await adminAdjustReferral({
        referralId: editTarget.id,
        status: editStatus,
        commissionEarned,
      });
      if (result.ok) {
        toast.success(`Updated ${editTarget.referrerName}'s referral`);
        patch(editTarget.id, { status: editStatus, commissionEarned });
        setEditTarget(null);
      } else {
        toast.error(result.error);
      }
    } finally {
      setEditPending(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl">Referrals admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} referral{list.length === 1 ? "" : "s"} total · one-time bonus paid out on
          each referral&apos;s first subscription payment.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total referrals", value: list.length },
          { label: "Active (subscribed)", value: list.filter((r) => r.status === "ACTIVE").length },
          { label: "Pending", value: list.filter((r) => r.status === "PENDING").length },
        ].map((s) => (
          <div key={s.label} className="surface bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="display mt-2 text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by referrer or referred name/email…"
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
              <TableHead>Referrer</TableHead>
              <TableHead>Referred instructor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium">{r.referrerName}</p>
                  <p className="text-xs text-muted-foreground">{r.referrerEmail}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{r.referredName}</p>
                  <p className="text-xs text-muted-foreground">{r.referredEmail}</p>
                </TableCell>
                <TableCell>
                  <StatusPill tone={statusTone(r.status)}>{r.status.toLowerCase()}</StatusPill>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.plan ? r.plan.toLowerCase() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {money(r.commissionEarned, r.referrerCurrency)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      setEditTarget(r);
                      setEditStatus(r.status);
                      setEditCommission(String(r.commissionEarned));
                    }}
                  >
                    Adjust
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No referrals match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust referral</DialogTitle>
            <DialogDescription>
              {editTarget?.referrerName} → {editTarget?.referredName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="referral-status">Status</Label>
            <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ReferralStatus)}>
              <SelectTrigger id="referral-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CHURNED">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral-commission">
              Bonus credited (in {editTarget?.referrerCurrency ?? "their"} currency, minor-free
              units)
            </Label>
            <Input
              id="referral-commission"
              type="number"
              min={0}
              value={editCommission}
              onChange={(e) => setEditCommission(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="clay" disabled={editPending} onClick={() => void handleSave()}>
              {editPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
