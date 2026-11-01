"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Flower2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BookingLinkAction } from "@/components/BookingLinkAction";
import { dashboardIcons } from "@/components/dashboard-icons";
import { dismissChecklist } from "./actions";
import styles from "./DashboardWelcome.module.css";

const stops = [
  {
    title: "Make room for your first class.",
    description:
      "Start with a name, date, and the way you’ll teach. Save a draft while you work, then publish when you’re ready.",
    label: "Open classes",
    href: "/dashboard/classes",
    Icon: dashboardIcons.classes,
    tip: "On your phone, Classes is in the bottom navigation.",
  },
  {
    title: "One page. All your teaching.",
    description:
      "Your booking page brings your profile, classes, and offers together. Preview it before sharing your link with students.",
    label: "Open my booking page settings",
    href: "/dashboard/booking-page",
    Icon: dashboardIcons.bookingPage,
    tip: "On your phone, find Booking page in the menu.",
  },
  {
    title: "Get to know the people who return.",
    description:
      "Your students appear here as they book. Connect payouts before accepting paid bookings, then follow your earnings from the dashboard.",
    label: "Open students",
    href: "/dashboard/students",
    Icon: dashboardIcons.students,
    tip: "Students is in the bottom navigation. Payouts is in the menu.",
  },
];

export function DashboardWelcome({
  name,
  hasPublishedClass,
}: {
  name: string;
  hasPublishedClass: boolean;
}) {
  const router = useRouter();
  const [tourOpen, setTourOpen] = useState(false);
  const [stop, setStop] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const reducedMotion = useReducedMotion();
  const current = stops[stop]!;

  async function dismiss() {
    setDismissing(true);
    try {
      await dismissChecklist();
      router.refresh();
    } catch {
      toast.error("We couldn’t dismiss your welcome. Please try again.");
    } finally {
      setDismissing(false);
    }
  }

  return (
    <>
      <motion.section
        className={styles["welcome"]}
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.4 }}
        aria-labelledby="dashboard-welcome-title"
      >
        <button
          className={styles["dismiss"]}
          aria-label="Dismiss welcome and setup guide"
          disabled={dismissing}
          onClick={() => void dismiss()}
        >
          <X size={17} />
        </button>
        <div className={styles["symbol"]}>
          {hasPublishedClass ? <Check size={26} /> : <Flower2 size={26} />}
        </div>
        <p className={styles["eyebrow"]}>
          {hasPublishedClass ? "Ready to welcome your students" : "A lovely place to begin"}
        </p>
        <h2 id="dashboard-welcome-title">
          {hasPublishedClass
            ? "Your class is ready. Let’s invite your people."
            : `Welcome, ${name}. Make yourself at home.`}
        </h2>
        <p className={styles["body"]}>
          {hasPublishedClass
            ? "Preview your page and share your link. Your students can explore and book without creating an account."
            : "Your teaching space is yours. Start with one class — a familiar practice, a time, and an invitation to join you."}
        </p>
        <div className={styles["actions"]}>
          {hasPublishedClass ? (
            <BookingLinkAction />
          ) : (
            <Button asChild className={styles["primary"]}>
              <Link href="/dashboard/classes/new">
                Create my first class <ArrowRight size={16} />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setStop(0);
              setTourOpen(true);
            }}
          >
            Show me around <ArrowRight size={15} />
          </Button>
        </div>
        <p className={styles["footnote"]}>
          {hasPublishedClass
            ? "Taking paid bookings? Make sure your payouts are connected."
            : "You can save a draft and take it at your own pace."}
        </p>
        {hasPublishedClass && (
          <Link href="/dashboard/payouts" className={styles["payoutLink"]}>
            Check payout setup <ArrowRight size={13} />
          </Link>
        )}
      </motion.section>
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className={styles["tour"]}>
          <p className={styles["eyebrow"]}>
            A little look around · {stop + 1} of {stops.length}
          </p>
          <motion.div
            key={stop}
            initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <div className={styles["tourIcon"]}>
              <current.Icon size={32} />
            </div>
            <DialogTitle className={styles["tourTitle"]}>{current.title}</DialogTitle>
            <DialogDescription className={styles["tourBody"]}>
              {current.description}
            </DialogDescription>
            <p className={styles["tip"]}>{current.tip}</p>
            <Link href={current.href} className={styles["destination"]}>
              {current.label} <ArrowRight size={14} />
            </Link>
          </motion.div>
          <div className={styles["tourActions"]}>
            <Button
              variant="ghost"
              onClick={() => (stop > 0 ? setStop(stop - 1) : setTourOpen(false))}
            >
              {stop > 0 ? (
                <>
                  <ArrowLeft size={15} /> Back
                </>
              ) : (
                "Skip tour"
              )}
            </Button>
            <Button
              className={styles["primary"]}
              onClick={() => (stop < stops.length - 1 ? setStop(stop + 1) : setTourOpen(false))}
            >
              {stop === stops.length - 1 ? "Make myself at home" : "Next"}
              <ArrowRight size={15} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
