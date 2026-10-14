"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supportsAccountResolve, supportsMobileMoney } from "@/lib/payout";
import { cn } from "@/lib/utils";
import {
  connectPayoutAccount,
  listPayoutBanks,
  resolvePayoutAccount,
} from "@/app/dashboard/payouts/actions";
import type { PaystackBank } from "@/lib/paystack";
import type { CurrencyCode } from "@/generated/prisma/enums";

type Method = "bank" | "mobile_money";

// The real bank/mobile-money connect flow (live bank list, optional account
// name verification, createSubaccount) — shared between the dashboard
// payouts page and onboarding step 2, which previously faked a successful
// connection without ever collecting bank details.
export function PayoutConnectForm({
  currency,
  onConnected,
  connectLabel = "Connect",
}: {
  currency: CurrencyCode;
  onConnected: () => void;
  connectLabel?: string;
}) {
  const mobileMoneyAvailable = supportsMobileMoney(currency);
  const canResolve = supportsAccountResolve(currency);

  const [method, setMethod] = useState<Method>("bank");
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
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
  }, [method]);

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
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("payout_account_connected", { currency, method });
        }
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
    <div className="space-y-4">
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
        <Label htmlFor="pcf-bank">{method === "bank" ? "Bank" : "Provider"}</Label>
        <select
          id="pcf-bank"
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
        <Label htmlFor="pcf-acct">{method === "bank" ? "Account number" : "Phone number"}</Label>
        <Input
          id="pcf-acct"
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
          We can&apos;t pre-verify account names for your country — double-check the details before
          connecting. Paystack validates the account when it settles your first payout.
        </p>
      ) : null}

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
          connectLabel
        )}
      </Button>
    </div>
  );
}
