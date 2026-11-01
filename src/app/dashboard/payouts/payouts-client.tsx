"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Flower2,
  ArrowRight,
  CreditCard,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
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
import Link from "next/link";
import styles from "./payouts.module.css";

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

        <PayoutConnectForm
          currency={instructor.currency}
          instructorName={instructor.name}
          onConnected={onConnected}
        />
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
      <div className={styles["page"]}>
        <header className={styles["header"]}>
          <div>
            <p className={styles["eyebrow"]}>Make room for the work you love</p>
            <h1>Payouts</h1>
          </div>
          <Link href="/dashboard/analytics#transactions">
            View transactions <ArrowUpRight size={16} />
          </Link>
        </header>
        <section className={styles["hero"]} aria-labelledby="payout-heading">
          <div className={styles["intro"]}>
            <Flower2 size={32} strokeWidth={1.2} aria-hidden="true" />
            <h2 id="payout-heading">
              Your teaching.
              <br />
              <em>Your earnings.</em>
            </h2>
            <p>
              A space to teach, and a clear path to getting paid. Connect your account so students
              can pay when they book.
            </p>
            <div className={styles["fee"]}>
              <strong>
                0<span>%</span>
              </strong>
              <div>
                Flowboc transaction fee
                <small>
                  Your subscription covers Flowboc.
                  <br />
                  Paystack processing fees still apply.
                </small>
              </div>
            </div>
          </div>
          <div className={styles["account"]}>
            <div className={styles["accountTop"]}>
              <span className={styles["bankIcon"]}>
                {connected ? (
                  <CheckCircle2 size={24} strokeWidth={1.5} />
                ) : provider === "PAYSTACK" ? (
                  <Building2 size={24} strokeWidth={1.5} />
                ) : (
                  <Smartphone size={24} strokeWidth={1.5} />
                )}
              </span>
              <span className={styles["status"]}>
                {connected
                  ? "Connected"
                  : provider === "PAYSTACK"
                    ? "Ready to connect"
                    : "Not yet supported"}
              </span>
            </div>
            <h3>
              {connected
                ? "A home for your earnings"
                : provider === "PAYSTACK"
                  ? "Let your practice pay off"
                  : "More currencies, in time"}
            </h3>
            {connected ? (
              <>
                <p>
                  Your payout account is connected. Manage the destination for your class payments
                  here.
                </p>
                <dl className={styles["details"]}>
                  <div>
                    <dt>Payout account</dt>
                    <dd>{instructor.payoutBankLabel || "Connected account"}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>Paystack</dd>
                  </div>
                  <div>
                    <dt>Currency</dt>
                    <dd>{instructor.currency}</dd>
                  </div>
                </dl>
                <Button
                  variant="ghost"
                  className={styles["disconnect"]}
                  disabled={disconnecting}
                  onClick={() => void handleDisconnect()}
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Disconnecting…
                    </>
                  ) : (
                    "Disconnect account"
                  )}
                </Button>
              </>
            ) : provider === "PAYSTACK" ? (
              <>
                <p>
                  Add your payout account to start accepting paid bookings. We’ll guide you through
                  the details.
                </p>
                <div className={styles["currency"]}>
                  <span>Payout currency</span>
                  <strong>{instructor.currency}</strong>
                </div>
                <button className={styles["connect"]} onClick={() => setDialogOpen(true)}>
                  Connect my payout account <ArrowRight size={17} />
                </button>
                <span className={styles["private"]}>
                  <ShieldCheck size={14} /> Account setup through Paystack
                </span>
              </>
            ) : (
              <>
                <p>
                  Payouts aren’t available yet for {instructor.currency}. Direct payouts currently
                  support NGN, GHS, ZAR, KES and XOF.
                </p>
                <div className={styles["currency"]}>
                  <span>Your currency</span>
                  <strong>{instructor.currency}</strong>
                </div>
                <p className={styles["small"]}>
                  You can still prepare your classes while you wait for payout support.
                </p>
              </>
            )}
          </div>
        </section>
        <section className={styles["journey"]} aria-labelledby="payment-journey">
          <h2 id="payment-journey">From their booking to your account</h2>
          <ol>
            {[
              {
                Icon: CreditCard,
                title: "A student books",
                body: "They pay for your class through your public page.",
              },
              {
                Icon: ShieldCheck,
                title: "Paystack processes it",
                body: "Paystack deducts its standard processing fee. Flowboc takes no transaction fee.",
              },
              {
                Icon: CalendarDays,
                title: "Your earnings settle",
                body: "Payments settle the next business day. First payouts may take longer for verification.",
              },
            ].map(({ Icon, title, body }, index) => (
              <li key={title}>
                <span className={styles["stepIcon"]}>
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <span className={styles["number"]}>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <aside className={styles["note"]}>
          <ShieldCheck size={22} strokeWidth={1.4} aria-hidden="true" />
          <div>
            <h2>A little clarity on your payouts</h2>
            <p>
              Paystack’s processing fees appear on your Paystack receipts. A newly connected or
              changed account may need a one-time verification, so the first payout can take longer.
              Flowboc never holds your funds.
            </p>
          </div>
        </aside>
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
