"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstructor } from "@/components/InstructorProvider";
import { payoutProviderForCurrency, payoutProviderInfo } from "@/lib/demo";

type PayoutStatus = "not_connected" | "pending" | "connected";

export function PayoutsClient() {
  const instructor = useInstructor();
  const [status, setStatus] = useState<PayoutStatus>("not_connected");
  const [dialogOpen, setDialogOpen] = useState(false);

  const provider = payoutProviderForCurrency(instructor.currency);
  const providerInfo = payoutProviderInfo[provider];

  useEffect(() => {
    if (status !== "pending") return;
    const timer = setTimeout(() => setStatus("connected"), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <DashboardShell>
      <div>
        <h1 className="text-3xl">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get paid directly for every class you teach — Flowbuk never holds your funds.
        </p>
      </div>

      {status === "not_connected" ? (
        <div className="surface mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
            <Building2 className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium">No payout account connected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect a payout account so students can pay you directly when they book a class.
            </p>
          </div>
          <Button variant="clay" onClick={() => setDialogOpen(true)}>
            Connect payout account
          </Button>
        </div>
      ) : null}

      {status === "pending" ? (
        <div className="surface mt-6 flex items-center gap-4 p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-warning/20 text-warning-foreground">
            <Loader2 className="size-5 animate-spin" />
          </span>
          <div>
            <p className="font-medium">Verifying your details</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;re confirming your account with {providerInfo.name}. This usually takes a few
              minutes.
            </p>
          </div>
        </div>
      ) : null}

      {status === "connected" ? (
        <div className="surface mt-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Payout account connected</p>
              <p className="mt-1 text-sm text-muted-foreground">{providerInfo.bankLabel}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setStatus("not_connected")}
            >
              Disconnect
            </Button>
          </div>
          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Payout provider
              </p>
              <p className="mt-1 text-sm font-medium">{providerInfo.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Payout schedule
              </p>
              <p className="mt-1 text-sm font-medium">Weekly, every Friday</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="surface mt-6 flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Flowbuk never touches your class payments. Students pay {providerInfo.name} directly, and
          funds settle straight to your connected account.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your payout account</DialogTitle>
            <DialogDescription>
              Based on your currency ({instructor.currency}), you&apos;ll be connected through{" "}
              {providerInfo.name}.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>
              You&apos;ll be redirected to {providerInfo.name} to verify your identity and bank
              details
            </li>
            <li>Flowbuk never sees or stores your bank details</li>
            <li>Once verified, class payments settle directly to your account</li>
          </ul>
          <DialogFooter>
            <Button
              variant="clay"
              className="w-full sm:w-auto"
              onClick={() => {
                setDialogOpen(false);
                setStatus("pending");
              }}
            >
              Continue to {providerInfo.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
