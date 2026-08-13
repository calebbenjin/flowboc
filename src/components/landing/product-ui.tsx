"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  BellRing,
  CalendarDays,
  Check,
  CreditCard,
  Home,
  Link2,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "./primitives";

/* ---------- shared chrome ---------- */

export function BrowserFrame({
  children,
  url = "flowbuk.com/dashboard",
  className,
}: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-sand/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-clay/50" />
        <span className="size-2.5 rounded-full bg-warning/50" />
        <span className="size-2.5 rounded-full bg-success/50" />
        <div className="ml-3 flex-1 truncate rounded-md bg-card px-3 py-1 text-[0.65rem] text-muted-foreground">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[248px] rounded-[2rem] border border-border bg-card p-2 shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-background">
        <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[0.6rem] text-muted-foreground">
          <span>9:41</span>
          <span>flowbuk.com</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function CountUp({ to, prefix = "" }: { to: number; prefix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [value, setValue] = React.useState(reduce ? to : 0);

  React.useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1100, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString("en-US")}
    </span>
  );
}

/* ---------- dashboard ---------- */

const stats = [
  { label: "Revenue", value: 1840, prefix: "$" },
  { label: "Bookings", value: 42, prefix: "" },
  { label: "Students", value: 68, prefix: "" },
];

const upcoming = [
  { name: "Morning Flow", when: "Today · 7:00 AM", booked: 8, cap: 12 },
  { name: "Evening Reset", when: "Today · 6:30 PM", booked: 10, cap: 15 },
];

const recent = [
  { name: "Emma Wilson", cls: "Morning Flow", amount: "$18" },
  { name: "Jessica Brown", cls: "Evening Reset", amount: "$18" },
];

export function DashboardMock({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr]">
      <aside className="hidden flex-col gap-1 border-r border-border bg-sand/40 p-4 sm:flex">
        <span className="display mb-4 text-sm">Flowbuk</span>
        {[
          { icon: Home, label: "Dashboard", active: true },
          { icon: CalendarDays, label: "Classes" },
          { icon: Users, label: "Students" },
          { icon: Wallet, label: "Payments" },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-2 text-[0.72rem]",
              item.active
                ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </div>
        ))}
      </aside>

      <div className={cn("space-y-5 p-5", compact ? "sm:p-6" : "sm:p-7")}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-base font-medium">Good morning, Sarah 👋</p>
            <p className="text-[0.72rem] text-muted-foreground">This week</p>
          </div>
          <Pill tone="clay">
            <Link2 className="size-3" /> flowbuk.com/sarah-yoga
          </Pill>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="rounded-xl border border-border bg-background/60 p-3"
            >
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="display mt-1 text-xl">
                <CountUp to={s.value} prefix={s.prefix} />
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Upcoming classes
            </p>
            <div className="space-y-2">
              {upcoming.map((c) => (
                <div key={c.name} className="rounded-xl border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.8rem] font-medium">{c.name}</p>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {c.booked} / {c.cap} booked
                    </span>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground">{c.when}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-secondary">
                    <motion.div
                      className="h-1.5 rounded-full bg-clay"
                      initial={reduce ? false : { width: 0 }}
                      whileInView={{ width: `${(c.booked / c.cap) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Recent bookings
            </p>
            <div className="space-y-2">
              {recent.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-full bg-secondary text-[0.65rem] font-medium">
                      {b.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <p className="text-[0.78rem] font-medium">{b.name}</p>
                      <p className="text-[0.66rem] text-muted-foreground">{b.cls}</p>
                    </div>
                  </div>
                  <Pill tone="success">
                    <Check className="size-3" /> Paid · {b.amount}
                  </Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- mobile booking ---------- */

export function MobileBookingMock({
  state = "class",
}: {
  state?: "class" | "details" | "pay" | "done";
}) {
  return (
    <PhoneFrame>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="size-7 rounded-full bg-clay/20" />
          <div>
            <p className="text-[0.78rem] font-medium">Sarah Yoga</p>
            <p className="text-[0.62rem] text-muted-foreground">Booking page</p>
          </div>
        </div>

        {state === "class" ? (
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[0.85rem] font-medium">Morning Flow</p>
            <p className="mt-1 text-[0.66rem] text-muted-foreground">Tuesday · 7:00 AM · 60 min</p>
            <p className="mt-1 flex items-center gap-1 text-[0.66rem] text-muted-foreground">
              <MapPin className="size-3" /> London
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Pill tone="success">8 spots remaining</Pill>
              <span className="display text-base">$18</span>
            </div>
            <div className="mt-3 rounded-lg bg-clay py-2 text-center text-[0.72rem] font-medium text-clay-foreground">
              Book Class
            </div>
          </div>
        ) : null}

        {state === "details" ? (
          <div className="space-y-2 rounded-xl border border-border bg-card p-3">
            <p className="text-[0.72rem] font-medium">Your details</p>
            {["Full name", "Email", "Phone"].map((f) => (
              <div
                key={f}
                className="rounded-md border border-border px-2 py-1.5 text-[0.66rem] text-muted-foreground"
              >
                {f}
              </div>
            ))}
            <div className="rounded-lg bg-clay py-2 text-center text-[0.72rem] font-medium text-clay-foreground">
              Continue
            </div>
          </div>
        ) : null}

        {state === "pay" ? (
          <div className="space-y-2 rounded-xl border border-border bg-card p-3">
            <p className="text-[0.72rem] font-medium">Payment</p>
            <div className="flex items-center gap-2 rounded-md border border-border px-2 py-2 text-[0.66rem] text-muted-foreground">
              <CreditCard className="size-3.5" /> •••• 4242
            </div>
            <div className="flex justify-between text-[0.7rem]">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">$18.00</span>
            </div>
            <div className="rounded-lg bg-clay py-2 text-center text-[0.72rem] font-medium text-clay-foreground">
              Pay $18
            </div>
          </div>
        ) : null}

        {state === "done" ? <ConfirmationCard /> : null}
      </div>
    </PhoneFrame>
  );
}

export function ConfirmationCard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-border bg-card p-4 text-center"
    >
      <span className="mx-auto grid size-9 place-items-center rounded-full bg-success/15 text-success">
        <Check className="size-4" />
      </span>
      <p className="mt-2 text-[0.82rem] font-medium">You&apos;re booked 🎉</p>
      <p className="mt-1 text-[0.66rem] text-muted-foreground">Morning Flow · Tuesday 7:00 AM</p>
      <div className="mt-3 rounded-lg border border-border py-1.5 text-[0.68rem]">
        Add to calendar
      </div>
    </motion.div>
  );
}

/* ---------- feature mocks ---------- */

export function ClassCreateMock() {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <p className="text-[0.75rem] font-medium">New class</p>
      <div className="rounded-md border border-border px-2.5 py-2 text-[0.7rem]">Morning Flow</div>
      <div className="grid grid-cols-2 gap-2 text-[0.68rem] text-muted-foreground">
        <div className="rounded-md border border-border px-2.5 py-2">Tue · 7:00 AM</div>
        <div className="rounded-md border border-border px-2.5 py-2">60 min</div>
        <div className="rounded-md border border-border px-2.5 py-2">12 spots</div>
        <div className="rounded-md border border-border px-2.5 py-2">$18</div>
      </div>
      <div className="flex items-center justify-between rounded-md bg-secondary px-2.5 py-2 text-[0.68rem]">
        Repeat weekly <span className="h-3.5 w-6 rounded-full bg-clay" />
      </div>
    </div>
  );
}

export function RevenueMock() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">This month</p>
        <Pill tone="success">
          <Check className="size-3" /> Payment received
        </Pill>
      </div>
      <p className="display text-2xl">$1,840</p>
      <div className="flex h-14 items-end gap-1.5">
        {[38, 52, 30, 66, 74, 48, 88].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-clay/70" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function StudentListMock() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-[0.7rem] uppercase tracking-wider text-muted-foreground">Students</p>
      <div className="space-y-2">
        {[
          ["Emma Wilson", "12 classes"],
          ["Jessica Brown", "8 classes"],
          ["Amara Cole", "5 classes"],
        ].map(([n, c]) => (
          <div key={n} className="flex items-center justify-between text-[0.72rem]">
            <span className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-secondary text-[0.6rem]">
                {String(n)
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
              {n}
            </span>
            <span className="text-muted-foreground">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReminderMock() {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
        <BellRing className="size-3.5 text-clay" /> Automated email
      </div>
      <p className="text-[0.78rem] font-medium">Morning Flow is tomorrow</p>
      <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
        Hi Emma — a reminder that your class starts Tuesday at 7:00 AM in London. See you on the
        mat.
      </p>
      <Pill tone="success">
        <Check className="size-3" /> Reminder sent
      </Pill>
    </div>
  );
}

export function ShareMock() {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <p className="text-[0.75rem] font-medium">Share your page</p>
      <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-[0.68rem] text-muted-foreground">
        <Link2 className="size-3.5" /> flowbuk.com/sarah-yoga
      </div>
      <div className="flex gap-2 text-[0.66rem]">
        {["Instagram", "WhatsApp", "Email"].map((s) => (
          <span key={s} className="rounded-full bg-secondary px-2.5 py-1">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
