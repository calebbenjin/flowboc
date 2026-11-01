"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { namesLikelyMatch, supportsAccountResolve, supportsMobileMoney } from "@/lib/payout";
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
  instructorName,
  onConnected,
  connectLabel = "Connect",
  onBusyChange,
}: {
  currency: CurrencyCode;
  instructorName: string;
  onConnected: () => void;
  connectLabel?: string;
  onBusyChange?: (busy: boolean) => void;
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
    onBusyChange?.(connecting);
    return () => onBusyChange?.(false);
  }, [connecting, onBusyChange]);
  // Set when connectPayoutAccount itself rejects the account over a name
  // mismatch — happens for currencies where handleVerify never ran (no
  // pre-resolve support), so resolvedName alone can't catch this case.
  const [serverMismatchName, setServerMismatchName] = useState<string | null>(null);
  const [confirmMismatch, setConfirmMismatch] = useState(false);

  useEffect(() => {
    setBanksLoading(true);
    setBankCode("");
    setAccountNumber("");
    setResolvedName(null);
    setServerMismatchName(null);
    setConfirmMismatch(false);
    void listPayoutBanks(method)
      .then((result) => {
        setBanksLoading(false);
        if (result.ok) {
          setBanks(result.banks);
        } else {
          toast.error(result.error);
        }
      })
      .catch(() => {
        setBanksLoading(false);
        toast.error("Couldn’t load banks. Reopen payout setup to try again.");
      });
  }, [method]);

  const bankName = banks.find((b) => b.code === bankCode)?.name ?? "";
  const needsVerify = method === "bank" && canResolve;
  const mismatchName =
    resolvedName && !namesLikelyMatch(instructorName, resolvedName)
      ? resolvedName
      : serverMismatchName;
  const canConnect =
    bankCode &&
    accountNumber &&
    (!needsVerify || resolvedName) &&
    (!mismatchName || confirmMismatch);

  async function handleVerify() {
    setResolving(true);
    setResolvedName(null);
    setServerMismatchName(null);
    setConfirmMismatch(false);
    try {
      const result = await resolvePayoutAccount({ bankCode, accountNumber });
      if (result.ok) {
        setResolvedName(result.accountName);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn’t verify the account. Check your connection and try again.");
    } finally {
      setResolving(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const result = await connectPayoutAccount({
        method,
        bankCode,
        bankName,
        accountNumber,
        confirmNameMismatch: confirmMismatch,
      });
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("payout_account_connected", { currency, method });
        }
        toast.success("Payout account connected");
        onConnected();
      } else if (result.mismatchedAccountName) {
        setServerMismatchName(result.mismatchedAccountName);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn’t connect your account. Your form is still here; please try again.");
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
            setServerMismatchName(null);
            setConfirmMismatch(false);
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
            setServerMismatchName(null);
            setConfirmMismatch(false);
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
          {resolvedName && !mismatchName && (
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

      {mismatchName && (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            This account is registered to <strong>{mismatchName}</strong>, which doesn&apos;t match
            your profile name (<strong>{instructorName}</strong>). Payouts can only go to an account
            in your own name.
          </p>
          <div className="flex items-start gap-2">
            <Checkbox
              id="pcf-confirm-mismatch"
              checked={confirmMismatch}
              onCheckedChange={(checked) => setConfirmMismatch(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="pcf-confirm-mismatch" className="font-normal text-sm leading-snug">
              This account is mine — the name is just formatted differently (e.g. a married name or
              registered business name).
            </Label>
          </div>
        </div>
      )}

      <Button
        type="button"
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
