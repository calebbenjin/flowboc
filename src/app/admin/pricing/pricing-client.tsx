"use client";

import { useState } from "react";
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
import { adminSetPrices } from "./actions";
import type { CurrencyCode, PlanTier } from "@/generated/prisma/enums";

type PlanInfo = { price: number; planCode: string } | null;

type Row = {
  currency: CurrencyCode;
  tier: PlanTier;
  monthly: PlanInfo;
  annual: PlanInfo;
};

const TIER_LABEL: Record<PlanTier, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  PREMIUM: "Premium",
};

function CurrencyRow({ row }: { row: Row }) {
  const [monthly, setMonthly] = useState(row.monthly?.price.toString() ?? "");
  const [annual, setAnnual] = useState(row.annual?.price.toString() ?? "");
  const [planCodes, setPlanCodes] = useState({
    monthly: row.monthly?.planCode ?? null,
    annual: row.annual?.planCode ?? null,
  });
  const [pending, setPending] = useState(false);

  async function handleSave() {
    const monthlyValue = Number(monthly);
    const annualValue = Number(annual);
    if (!monthlyValue || !annualValue) {
      toast.error("Enter both a monthly and annual price.");
      return;
    }

    setPending(true);
    try {
      const result = await adminSetPrices({
        currency: row.currency,
        tier: row.tier,
        monthly: monthlyValue,
        annual: annualValue,
      });
      if (result.ok) {
        toast.success(`${row.currency} pricing saved`);
        setPlanCodes({ monthly: result.monthlyPlanCode, annual: result.annualPlanCode });
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{row.currency}</TableCell>
      <TableCell>{TIER_LABEL[row.tier]}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          value={monthly}
          onChange={(e) => setMonthly(e.target.value)}
          className="w-28"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          value={annual}
          onChange={(e) => setAnnual(e.target.value)}
          className="w-28"
        />
      </TableCell>
      <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
        {planCodes.monthly || planCodes.annual
          ? `${planCodes.monthly ?? "—"} / ${planCodes.annual ?? "—"}`
          : "No plan yet"}
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="clay" disabled={pending} onClick={() => void handleSave()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function PricingClient({ rows }: { rows: Row[] }) {
  return (
    <div>
      <div>
        <h1 className="text-3xl">Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set each plan&apos;s monthly and annual price, per currency and tier.
        </p>
      </div>

      <div className="surface mt-6 flex items-start gap-3 p-4 text-sm text-muted-foreground">
        <Label className="sr-only">Note</Label>
        <p>
          Startbutton plans are immutable — saving a changed price here creates a brand-new
          Startbutton plan rather than editing the old one. Instructors already subscribed keep
          their existing price until they resubscribe; this only affects new subscriptions going
          forward.
        </p>
      </div>

      <div className="surface mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Monthly price</TableHead>
              <TableHead>Annual price</TableHead>
              <TableHead>Plan codes (monthly / annual)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <CurrencyRow key={`${row.currency}-${row.tier}`} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
