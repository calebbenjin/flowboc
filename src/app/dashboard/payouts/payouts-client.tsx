"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CheckCircle2, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstructor } from "@/components/InstructorProvider";
import { PayoutConnectForm } from "@/components/PayoutConnectForm";
import { payoutProviderForCurrency } from "@/lib/payout";
import { disconnectPayoutAccount } from "./actions";

function ConnectDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}) {
  const instructor = useInstructor();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your payout account</DialogTitle>
          <DialogDescription>
            Based on your currency ({instructor.currency}), you&apos;ll be connected through
            Paystack. Flowboc sends your details directly to Paystack to set up payouts — we only
            keep the last 4 digits for your reference, never the full number.
          </DialogDescription>
        </DialogHeader>

        <PayoutConnectForm currency={instructor.currency} onConnected={onConnected} />
      </DialogContent>
    </Dialog>
  );
}

export function PayoutsClient() {
  const router = useRouter();
  const instructor = useInstructor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const provider = payoutProviderForCurrency(instructor.currency);
  const connected = instructor.payoutStatus === "CONNECTED";

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const result = await disconnectPayoutAccount();
      if (result.ok) {
        toast.success("Payout account disconnected");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <DashboardShell>
      <div>
        <h1 className="text-3xl">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get paid directly for every class you teach — Flowboc never holds your funds.
        </p>
      </div>

      {!connected && provider === "PAYSTACK" ? (
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

      {!connected && provider !== "PAYSTACK" ? (
        <div className="surface mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
            <Smartphone className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium">
              Payouts aren&apos;t available yet for {instructor.currency}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Flowboc currently supports direct payouts for NGN, GHS, ZAR, KES and XOF. Support for{" "}
              {instructor.currency} is on the way.
            </p>
          </div>
        </div>
      ) : null}

      {connected ? (
        <div className="surface mt-6 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Payout account connected</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {instructor.payoutBankLabel}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={disconnecting}
              onClick={() => void handleDisconnect()}
            >
              {disconnecting ? <Loader2 className="size-4 animate-spin" /> : "Disconnect"}
            </Button>
          </div>
          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Payout provider
              </p>
              <p className="mt-1 text-sm font-medium">Paystack</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Flowboc&apos;s cut
              </p>
              <p className="mt-1 text-sm font-medium">0% — Flowboc is subscription-only</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Settlement time
              </p>
              <p className="mt-1 text-sm font-medium">Next business day</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="surface mt-6 flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Flowboc takes 0% of every payment — class payments go straight to your account. Paystack
          still deducts its own standard processing fee per transaction (visible on your Paystack
          receipts); that fee is Paystack&apos;s, not Flowboc&apos;s. Payments settle to your
          account the next business day. Your very first payout may take a little longer — Paystack
          briefly holds it for a one-time account verification whenever a payout account is newly
          connected or changed.
        </p>
      </div>

      <ConnectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnected={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </DashboardShell>
  );
}
