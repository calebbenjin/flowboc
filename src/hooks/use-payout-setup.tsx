"use client";

import { useRef, useState } from "react";
import { Check, Landmark } from "lucide-react";
import { useInstructor } from "@/components/InstructorProvider";
import { PayoutConnectForm } from "@/components/PayoutConnectForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { needsPayoutSetup } from "@/lib/payout-setup";
import { payoutProviderForCurrency } from "@/lib/payout";

export function usePayoutSetup() {
  const instructor = useInstructor();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const connectedHere = useRef(false);
  const supported = payoutProviderForCurrency(instructor.currency) === "PAYSTACK";
  function check(price: number, publishing = true) {
    if (connectedHere.current || !needsPayoutSetup(instructor, price, publishing)) return false;
    setOpen(true);
    return true;
  }
  return {
    check,
    dialog: (
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-[#eeebff] text-[#6355ff]">
              {connected ? <Check size={24} /> : <Landmark size={24} strokeWidth={1.5} />}
            </span>
            <DialogTitle>
              {connected
                ? "You’re ready to receive payments"
                : "Connect your bank to receive payments"}
            </DialogTitle>
            <DialogDescription>
              {connected
                ? "Your payout account is connected. Your entered details are still here—return to the form to review and publish when you’re ready."
                : "Connect a payout account before this paid offering goes live. Your entered details stay in place while you set it up here."}
            </DialogDescription>
          </DialogHeader>
          {connected ? (
            <Button
              className="min-h-11 bg-[#6355ff] text-white hover:bg-[#5142e5]"
              onClick={() => setOpen(false)}
            >
              Continue editing
            </Button>
          ) : supported ? (
            <>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Paystack handles your bank details. Flowboc only keeps the last four digits for
                reference.
              </p>
              <PayoutConnectForm
                currency={instructor.currency}
                instructorName={instructor.name}
                connectLabel="Connect payout account"
                onBusyChange={setBusy}
                onConnected={() => {
                  connectedHere.current = true;
                  setConnected(true);
                }}
              />
              <Button
                variant="ghost"
                disabled={busy}
                className="min-h-11"
                onClick={() => setOpen(false)}
              >
                Keep editing for now
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Paid payouts aren’t available for {instructor.currency} yet. You can save this as a
                draft or offer it for free. Supported payout currencies are NGN, GHS, ZAR, KES and
                XOF.
              </p>
              <Button variant="quiet" onClick={() => setOpen(false)}>
                Back to my form
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    ),
  };
}
