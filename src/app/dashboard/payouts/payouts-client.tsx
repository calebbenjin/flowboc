"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CheckCircle2, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstructor } from "@/components/InstructorProvider";
import {
  payoutProviderForCurrency,
  supportsAccountResolve,
  supportsMobileMoney,
} from "@/lib/payout";
import { cn } from "@/lib/utils";
import {
  connectPayoutAccount,
  disconnectPayoutAccount,
  listPayoutBanks,
  resolvePayoutAccount,
} from "./actions";
import type { PaystackBank } from "@/lib/paystack";

type Method = "bank" | "mobile_money";

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
  const mobileMoneyAvailable = supportsMobileMoney(instructor.currency);
  const canResolve = supportsAccountResolve(instructor.currency);

  const [method, setMethod] = useState<Method>("bank");
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBanksLoading(true);
    setBankCode("");
    setAccountNumber("");
    setResolvedName(null);
    void listPayoutBanks(method).then((result) => {
      setBanksLoading(false);
      if (result.ok) {
        setBanks(result.banks);
      } else {
        toast.error(result.error);
      }
    });
  }, [open, method]);

  const bankName = banks.find((b) => b.code === bankCode)?.name ?? "";
  const needsVerify = method === "bank" && canResolve;
  const canConnect = bankCode && accountNumber && (!needsVerify || resolvedName);

  async function handleVerify() {
    setResolving(true);
    setResolvedName(null);
    try {
      const result = await resolvePayoutAccount({ bankCode, accountNumber });
      if (result.ok) {
        setResolvedName(result.accountName);
      } else {
        toast.error(result.error);
      }
    } finally {
      setResolving(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const result = await connectPayoutAccount({ method, bankCode, bankName, accountNumber });
      if (result.ok) {
        toast.success("Payout account connected");
        onConnected();
      } else {
        toast.error(result.error);
      }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your payout account</DialogTitle>
          <DialogDescription>
            Based on your currency ({instructor.currency}), you&apos;ll be connected through
            Paystack. Flowbuk sends your details directly to Paystack to set up payouts — we only
            keep the last 4 digits for your reference, never the full number.
          </DialogDescription>
        </DialogHeader>

        {mobileMoneyAvailable && (
          <div className="flex gap-2">
            {(["bank", "mobile_money"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  method === m
                    ? "border-clay bg-clay/5 text-clay"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {m === "bank" ? "Bank account" : "Mobile money"}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pbank">{method === "bank" ? "Bank" : "Provider"}</Label>
          <select
            id="pbank"
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              setResolvedName(null);
            }}
            disabled={banksLoading}
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-60"
          >
            <option value="">{banksLoading ? "Loading…" : "Select…"}</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pacct">{method === "bank" ? "Account number" : "Phone number"}</Label>
          <Input
            id="pacct"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              setResolvedName(null);
            }}
            placeholder={method === "bank" ? "0123456789" : "0551234567"}
          />
        </div>

        {needsVerify ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              disabled={!bankCode || !accountNumber || resolving}
              onClick={() => void handleVerify()}
            >
              {resolving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying…
                </>
              ) : (
                "Verify account"
              )}
            </Button>
            {resolvedName && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="size-4" /> {resolvedName}
              </p>
            )}
          </div>
        ) : method === "bank" ? (
          <p className="text-xs text-muted-foreground">
            We can&apos;t pre-verify account names for your country — double-check the details
            before connecting. Paystack validates the account when it settles your first payout.
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="clay"
            className="w-full sm:w-auto"
            disabled={!canConnect || connecting}
            onClick={() => void handleConnect()}
          >
            {connecting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Connecting…
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </DialogFooter>
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
          Get paid directly for every class you teach — Flowbuk never holds your funds.
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
              Flowbuk currently supports direct payouts for NGN, GHS, ZAR, KES and XOF. Support for{" "}
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
                Flowbuk&apos;s cut
              </p>
              <p className="mt-1 text-sm font-medium">0% — Flowbuk is subscription-only</p>
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
          Flowbuk takes 0% of every payment — class payments go straight to your account. Paystack
          still deducts its own standard processing fee per transaction (visible on your Paystack
          receipts); that fee is Paystack&apos;s, not Flowbuk&apos;s. Payments settle to your
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
