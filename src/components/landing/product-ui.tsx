"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import {
  BatteryFull,
  BellRing,
  CalendarDays,
  Check,
  CreditCard,
  Home,
  ImagePlus,
  Link2,
  Loader2,
  MapPin,
  SignalHigh,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import { siteHost } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Pill } from "./primitives";
import Image from "next/image";

/* ---------- shared chrome ---------- */

export function BrowserFrame({
  children,
  url = `${siteHost}/dashboard`,
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
    <div className={cn("relative w-[280px]", className)}>
      {/* side buttons */}
      <span className="absolute -left-[3px] top-[88px] h-6 w-[3px] rounded-l-sm bg-foreground/70" />
      <span className="absolute -left-[3px] top-[124px] h-10 w-[3px] rounded-l-sm bg-foreground/70" />
      <span className="absolute -left-[3px] top-[168px] h-10 w-[3px] rounded-l-sm bg-foreground/70" />
      <span className="absolute -right-[3px] top-[128px] h-14 w-[3px] rounded-r-sm bg-foreground/70" />

      <div className="rounded-[2.8rem] bg-foreground p-[7px] shadow-[var(--shadow-lift)]">
        <div className="relative overflow-hidden rounded-[2.35rem] bg-background">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-[9px] z-20 h-[20px] w-[86px] -translate-x-1/2 rounded-full bg-foreground" />

          <div className="relative z-10 flex items-center justify-between px-5 pb-1 pt-3 text-[0.6rem] font-medium text-foreground">
            <span>9:41</span>
            <span className="flex items-center gap-1 text-foreground/80">
              <SignalHigh className="size-3" />
              <Wifi className="size-3" />
              <BatteryFull className="size-3.5" />
            </span>
          </div>

          {children}

          <div className="flex justify-center pb-1.5 pt-2">
            <span className="h-1 w-28 rounded-full bg-foreground/25" />
          </div>
        </div>
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
        <span className="display mb-4 text-sm">Flowboc</span>
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
            <Link2 className="size-3" /> {siteHost}/sarah-yoga
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

const badgeTone = {
  clay: "bg-clay/12 text-clay",
  mint: "bg-mint/20 text-mint-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
} as const;

function IconBadge({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof badgeTone;
}) {
  return (
    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", badgeTone[tone])}>
      <Icon className="size-3" />
    </span>
  );
}

export function ClassCreateMock() {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <IconBadge icon={CalendarDays} tone="clay" />
        <p className="text-[0.75rem] font-medium">New class</p>
      </div>
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

// Walks through the real create-class form's three "surface" cards exactly
// as ClassForm.tsx defines them — same section labels, same field order
// (recurring toggle before date/time, capacity before price), same cover
// photo upload flow — one card fully revealed at a time, like swiping
// through a short wizard. Loops while the phone is the active "how it
// works" step, then hands off to a success card with a confetti burst
// scoped to the phone's own canvas (so particles clip to the screen instead
// of spilling across the page). Freezes on the finished state for
// reduced-motion users since there's no safe "pause" point mid-fill.
type CoverPhase = "idle" | "uploading" | "done";

function MiniLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.52rem] font-medium text-muted-foreground/70">{children}</p>;
}

function MiniSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
      {children}
    </p>
  );
}

function MiniField({
  label,
  value,
  revealed,
  full,
  wrap,
  reduce,
}: {
  label: string;
  value: string;
  revealed: boolean;
  full?: boolean;
  wrap?: boolean;
  reduce: boolean | null;
}) {
  return (
    <div className={cn("space-y-1", full ? "w-full" : "w-[calc(50%-0.25rem)]")}>
      <MiniLabel>{label}</MiniLabel>
      <div
        className={cn(
          "flex items-center rounded-md border border-border px-2 py-1.5 text-[0.62rem] text-muted-foreground",
          wrap ? "min-h-[2.4rem] items-start" : "min-h-[1.7rem]",
        )}
      >
        {revealed ? (
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("text-foreground", wrap ? "leading-snug" : "truncate")}
          >
            {value}
          </motion.span>
        ) : null}
      </div>
    </div>
  );
}

function MiniToggle({ label, helper, on }: { label: string; helper: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-secondary px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-[0.62rem] font-medium">{label}</p>
        <p className="truncate text-[0.5rem] text-muted-foreground">{helper}</p>
      </div>
      <span
        className={cn(
          "h-3.5 w-6 shrink-0 rounded-full transition-colors duration-300",
          on ? "bg-clay" : "bg-border",
        )}
      />
    </div>
  );
}

function MiniPills({ options, selected }: { options: string[]; selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <span
          key={o}
          className={cn(
            "rounded-full px-2 py-1 text-[0.54rem] font-medium transition-colors duration-300",
            selected.includes(o)
              ? "bg-clay text-clay-foreground"
              : "border border-border text-muted-foreground",
          )}
        >
          {o}
        </span>
      ))}
    </div>
  );
}

function MiniCoverPhoto({ phase, reduce }: { phase: CoverPhase; reduce: boolean | null }) {
  return (
    <div className="space-y-1">
      <MiniLabel>Cover photo</MiniLabel>
      <div
        className={cn(
          "flex h-16 items-center justify-center gap-1.5 overflow-hidden rounded-md text-[0.56rem] text-muted-foreground",
          phase === "done" ? "border border-border" : "border border-dashed border-border",
        )}
      >
        {phase === "idle" ? (
          <>
            <ImagePlus className="size-3.5" /> Drop an image
          </>
        ) : phase === "uploading" ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Uploading…
          </>
        ) : (
          <motion.img
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src="/demo/morning-mats.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}

function ClassCardOne({
  revealed,
  coverPhase,
  reduce,
}: {
  revealed: Record<string, boolean>;
  coverPhase: CoverPhase;
  reduce: boolean | null;
}) {
  return (
    <div className="space-y-2">
      <MiniSectionLabel>The class</MiniSectionLabel>
      <div className="flex gap-2">
        <MiniField
          label="Class name"
          value="Morning Flow"
          revealed={!!revealed["name"]}
          reduce={reduce}
        />
        <MiniField
          label="Class type"
          value="Vinyasa"
          revealed={!!revealed["type"]}
          reduce={reduce}
        />
      </div>
      <MiniField
        label="Description"
        value="Slow, breath-led flow to start your day grounded."
        revealed={!!revealed["description"]}
        full
        wrap
        reduce={reduce}
      />
      <MiniCoverPhoto phase={coverPhase} reduce={reduce} />
    </div>
  );
}

function ClassCardTwo({
  revealed,
  recurringOn,
  reduce,
}: {
  revealed: Record<string, boolean>;
  recurringOn: boolean;
  reduce: boolean | null;
}) {
  return (
    <div className="space-y-2">
      <MiniSectionLabel>When &amp; where</MiniSectionLabel>
      <MiniToggle
        label="Recurring class"
        helper="Repeats weekly until you end the series"
        on={recurringOn}
      />
      <AnimatePresence initial={false}>
        {recurringOn ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-2 overflow-hidden"
          >
            <MiniPills
              options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
              selected={["Tue", "Thu"]}
            />
            <MiniPills options={["2 weeks", "1 month", "2 months"]} selected={["1 month"]} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex gap-2">
        <MiniField
          label="Starts on"
          value="Tue, Oct 21"
          revealed={!!revealed["date"]}
          reduce={reduce}
        />
        <MiniField
          label="Start time"
          value="7:00 AM"
          revealed={!!revealed["time"]}
          reduce={reduce}
        />
      </div>
      <div className="flex gap-2">
        <MiniField
          label="Timezone"
          value="GMT+1 · Lagos"
          revealed={!!revealed["timezone"]}
          reduce={reduce}
        />
        <MiniField
          label="Duration"
          value="60 min"
          revealed={!!revealed["duration"]}
          reduce={reduce}
        />
      </div>
      <MiniToggle
        label="Online class"
        helper="Students receive a link instead of an address"
        on={false}
      />
      <MiniField
        label="Location"
        value="Freedom Park Studio, Lekki"
        revealed={!!revealed["location"]}
        full
        reduce={reduce}
      />
    </div>
  );
}

function ClassCardThree({
  revealed,
  reduce,
}: {
  revealed: Record<string, boolean>;
  reduce: boolean | null;
}) {
  return (
    <div className="space-y-2">
      <MiniSectionLabel>Price &amp; spots</MiniSectionLabel>
      <div className="flex gap-2">
        <MiniField label="Currency" value="₦ NGN" revealed reduce={reduce} />
        <MiniField
          label="Max capacity"
          value="12"
          revealed={!!revealed["capacity"]}
          reduce={reduce}
        />
      </div>
      <MiniField label="Price" value="₦8,000" revealed={!!revealed["price"]} full reduce={reduce} />
      {revealed["price"] ? (
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="text-[0.5rem] text-muted-foreground"
        >
          Paystack fee ~₦120 — you&apos;ll net ₦7,880
        </motion.p>
      ) : null}
      <MiniField
        label="Original price (optional)"
        value="₦9,500"
        revealed={!!revealed["originalPrice"]}
        full
        reduce={reduce}
      />
      <MiniField
        label="Booking deadline"
        value="2 hours before"
        revealed={!!revealed["deadline"]}
        reduce={reduce}
      />
      <MiniField
        label="Cancellation policy"
        value="Free cancellation up to 12 hrs before class."
        revealed={!!revealed["cancellation"]}
        full
        wrap
        reduce={reduce}
      />
    </div>
  );
}

const CARD_LABELS = ["The class", "When & where", "Price & spots"];
const STEP = 360;
const CARD_HOLD = 550;
const SUCCESS_HOLD = 2200;
const RESTART_GAP = 500;

export function CreateClassPhoneMock({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fireConfettiRef = React.useRef<ReturnType<typeof confetti.create> | null>(null);

  const [cardIndex, setCardIndex] = React.useState(reduce ? 2 : 0);
  const [revealed, setRevealed] = React.useState<Record<string, boolean>>({});
  const [recurringOn, setRecurringOn] = React.useState(!!reduce);
  const [coverPhase, setCoverPhase] = React.useState<CoverPhase>(reduce ? "done" : "idle");
  const [pressed, setPressed] = React.useState(false);
  const [phase, setPhase] = React.useState<"form" | "success">(reduce ? "success" : "form");

  const reveal = (key: string) => setRevealed((r) => ({ ...r, [key]: true }));

  React.useEffect(() => {
    if (canvasRef.current && !fireConfettiRef.current) {
      fireConfettiRef.current = confetti.create(canvasRef.current, { resize: true });
    }
  }, []);

  React.useEffect(() => {
    if (reduce || !active) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 0;
    const after = (ms: number, fn: () => void) => {
      t += ms;
      timers.push(setTimeout(fn, t));
    };

    const run = () => {
      t = 0;
      setPhase("form");
      setCardIndex(0);
      setRevealed({});
      setRecurringOn(false);
      setCoverPhase("idle");
      setPressed(false);

      // Card 1 — The class
      after(STEP, () => reveal("name"));
      after(STEP, () => reveal("type"));
      after(STEP, () => reveal("description"));
      after(STEP, () => setCoverPhase("uploading"));
      after(STEP, () => setCoverPhase("done"));
      after(CARD_HOLD, () => setCardIndex(1));

      // Card 2 — When & where (recurring toggle flips before its day/
      // horizon pickers, matching the real form's field order)
      after(STEP, () => setRecurringOn(true));
      after(STEP, () => reveal("date"));
      after(STEP, () => reveal("time"));
      after(STEP, () => reveal("timezone"));
      after(STEP, () => reveal("duration"));
      after(STEP, () => reveal("location"));
      after(CARD_HOLD, () => setCardIndex(2));

      // Card 3 — Price & spots
      after(STEP, () => reveal("capacity"));
      after(STEP, () => reveal("price"));
      after(STEP, () => reveal("originalPrice"));
      after(STEP, () => reveal("deadline"));
      after(STEP, () => reveal("cancellation"));
      after(300, () => setPressed(true));

      after(220, () => {
        setPhase("success");
        fireConfettiRef.current?.({
          particleCount: 60,
          spread: 70,
          startVelocity: 26,
          gravity: 1.1,
          scalar: 0.55,
          origin: { x: 0.5, y: 0.3 },
        });
      });

      after(SUCCESS_HOLD + RESTART_GAP, run);
    };

    run();
    return () => timers.forEach(clearTimeout);
  }, [active, reduce]);

  return (
    <PhoneFrame>
      <div className="relative min-h-124 p-4 bg-white">
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        />
        <AnimatePresence mode="wait">
          {phase === "form" ? (
            <motion.div
              key="form"
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconBadge icon={CalendarDays} tone="clay" />
                  <p className="text-[0.75rem] font-medium">New class</p>
                </div>
                <div className="flex items-center gap-1">
                  {CARD_LABELS.map((label, i) => (
                    <span
                      key={label}
                      className={cn(
                        "size-1.5 rounded-full transition-colors duration-300",
                        i === cardIndex ? "bg-clay" : "bg-border",
                      )}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={cardIndex}
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {cardIndex === 0 ? (
                    <ClassCardOne revealed={revealed} coverPhase={coverPhase} reduce={reduce} />
                  ) : cardIndex === 1 ? (
                    <ClassCardTwo revealed={revealed} recurringOn={recurringOn} reduce={reduce} />
                  ) : (
                    <ClassCardThree revealed={revealed} reduce={reduce} />
                  )}
                </motion.div>
              </AnimatePresence>

              {cardIndex === 2 ? (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <span className="rounded-md px-2.5 py-1.5 text-[0.6rem] font-medium text-muted-foreground">
                    Save as draft
                  </span>
                  <motion.span
                    animate={reduce ? false : { scale: pressed ? 0.95 : 1 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-md bg-clay px-3 py-1.5 text-[0.6rem] font-medium text-clay-foreground"
                  >
                    Publish
                  </motion.span>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-116 flex-col items-center justify-center text-center"
            >
              <span className="grid size-10 place-items-center rounded-full bg-success/15 text-success">
                <Check className="size-4.5" />
              </span>
              <p className="mt-3 text-[0.82rem] font-medium">Class published 🎉</p>
              <p className="mt-1 text-[0.66rem] text-muted-foreground">
                Morning Flow · Tue, Oct 21 · 7:00 AM
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PhoneFrame>
  );
}

export function RevenueMock() {
  return (
    <div className="mx-auto flex w-full max-w-[280px] items-center justify-center lg:max-w-[240px]">
      <PhoneFrame className="w-[280px] lg:w-[240px]">
        <div className="relative aspect-[9/19.5] w-full overflow-hidden">
          <Image
            src="/analytics-page.png"
            alt="Flowboc dashboard showing revenue, upcoming classes and bookings"
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 170px"
            priority
            className="object-cover object-top"
          />
        </div>
      </PhoneFrame>
    </div>
  );
}

export function StudentListMock() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <IconBadge icon={Users} tone="success" />
        <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">Students</p>
      </div>
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
        <IconBadge icon={BellRing} tone="warning" /> Automated email
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

const sharePlatforms = [
  { label: "Instagram", className: "bg-[#E1306C] text-white" },
  { label: "TikTok", className: "bg-foreground text-background" },
  { label: "WhatsApp", className: "bg-[#25D366] text-white" },
  { label: "YouTube", className: "bg-[#FF0000] text-white" },
  { label: "Email", className: "bg-white text-secondary-foreground" },
];

export function ShareMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[280px] flex-col items-center gap-1 text-center lg:max-w-[260px]">
      <div className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-xs shadow-(--shadow-soft) sm:text-sm">
        <Link2 className="size-3.5 shrink-0 text-muted-foreground sm:size-4" />
        <span className="truncate">{siteHost}/sarah-yoga</span>
      </div>

      {!compact ? (
        <PhoneFrame className="w-[280px] lg:w-[240px] min-h-124">
          <div className="relative aspect-[9/19.5] w-full overflow-hidden">
            <Image
              src="/screenshot-pb.png"
              alt="Flowboc booking page showing an instructor's profile, a bookable video call and upcoming classes"
              fill
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 170px"
              priority
              className="object-cover object-top"
            />
          </div>
        </PhoneFrame>
      ) : null}

      {/* <div className="flex flex-wrap items-center justify-center gap-2">
        {sharePlatforms.map((p) => (
          <span
            key={p.label}
            className={cn(
              "rounded-md px-3 py-1.5 text-[0.7rem] font-semibold sm:px-4 sm:py-2 sm:text-sm",
              p.className,
            )}
          >
            {p.label}
          </span>
        ))}
      </div> */}
    </div>
  );
}
