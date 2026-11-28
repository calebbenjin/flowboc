"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  ArrowUpRight,
  CalendarDays,
  Flower2,
  Sprout,
  HeartHandshake,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { MobileSheet, sheetActionClass } from "@/components/MobileSheet";
import { useInstructor } from "@/components/InstructorProvider";
import { money } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import type { StudentRow } from "./queries";
import styles from "./students.module.css";

const filters = ["Everyone", "Returning", "Upcoming class"] as const;
type Filter = (typeof filters)[number];

const sorts = {
  classes: {
    label: "Most classes",
    compare: (a: StudentRow, b: StudentRow) => b.classesBooked - a.classesBooked,
  },
  recent: {
    label: "Most recent",
    compare: (a: StudentRow, b: StudentRow) => lastSeen(b) - lastSeen(a),
  },
  spent: {
    label: "Top spenders",
    compare: (a: StudentRow, b: StudentRow) => b.totalSpent - a.totalSpent,
  },
  name: {
    label: "Name A–Z",
    compare: (a: StudentRow, b: StudentRow) => a.name.localeCompare(b.name),
  },
} as const;
type SortKey = keyof typeof sorts;

// The directory renders in pages so a long list stays light to scroll;
// search and sort still cover every student.
const PAGE_SIZE = 50;

const avatarTones = [
  "bg-[#ede7fc] text-[#5143dd]",
  "bg-[#f3eadf] text-[#8a5a33]",
  "bg-[#efe9f2] text-[#7a4f86]",
];

// An upcoming class counts as the most recent activity.
function lastSeen(s: StudentRow) {
  return (s.upcoming?.startAt ?? s.lastBookingAt)?.getTime() ?? 0;
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "S"
  );
}

function activityLabel(s: StudentRow) {
  if (s.upcoming) return `Next: ${formatClassDate(s.upcoming)}`;
  if (s.lastBookingAt)
    return `Last class ${formatDistanceToNow(s.lastBookingAt, { addSuffix: true })}`;
  return "No classes yet";
}

export function StudentsClient({ students }: { students: StudentRow[] }) {
  const instructor = useInstructor();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Everyone");
  const [sort, setSort] = useState<SortKey>("classes");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter(
        (student) =>
          (!q ||
            student.name.toLowerCase().includes(q) ||
            student.email.toLowerCase().includes(q) ||
            student.phone?.includes(q)) &&
          (filter !== "Returning" || student.classesBooked > 1) &&
          (filter !== "Upcoming class" || student.upcoming !== null),
      )
      .sort(sorts[sort].compare);
  }, [students, query, filter, sort]);
  const shown = filtered.slice(0, visible);
  const returning = students.filter((student) => student.classesBooked > 1).length;
  const upcoming = students.filter((student) => student.upcoming).length;
  return (
    <DashboardShell>
      <header className={styles["header"]}>
        <div>
          <p className={styles["eyebrow"]}>The people behind your practice</p>
          <h1>Students</h1>
        </div>
        <Link href="/dashboard/classes" className={styles["textLink"]}>
          View your classes <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className={styles["welcome"]} aria-label="Your teaching community">
        <div className={styles["welcomeCopy"]}>
          <span className={styles["mark"]}>
            <HeartHandshake size={27} strokeWidth={1.5} />
          </span>
          <h2>
            A little connection.
            <br />A growing community.
          </h2>
          <p>
            Every familiar face starts with a first class. Keep up with the people making space for
            your teaching.
          </p>
        </div>
        <dl className={styles["stats"]}>
          {[
            { label: "Students in your circle", value: students.length, Icon: Flower2 },
            { label: "Returning students", value: returning, Icon: Sprout },
            { label: "With an upcoming class", value: upcoming, Icon: CalendarDays },
          ].map(({ label, value, Icon }) => (
            <div key={label}>
              <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
              <dt>{label}</dt>
              <dd>{value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={styles["directory"]} aria-label="Student directory">
        <div className={styles["directoryHeader"]}>
          <div>
            <h2>Your circle</h2>
            <p>
              {filtered.length} {filtered.length === 1 ? "student" : "students"}
              {filter !== "Everyone" || query ? " found" : " · built from your class bookings"}
            </p>
          </div>
          <label className={styles["search"]}>
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search students by name or email</span>
            <input
              placeholder="Find a name or email"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisible(PAGE_SIZE);
              }}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={styles["filters"]} role="group" aria-label="Filter students">
            {filters.map((value) => (
              <button
                key={value}
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value);
                  setVisible(PAGE_SIZE);
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#7d708c]">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="min-h-10 rounded-xl border border-[#e2daec] bg-[#fffdf9] px-3 text-sm text-foreground"
            >
              {(Object.keys(sorts) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {sorts[key].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filtered.length === 0 ? (
          <div className={styles["empty"]}>
            <Flower2 size={38} strokeWidth={1.3} />
            <h3>
              {students.length ? "No students in this view" : "Your circle starts with one student"}
            </h3>
            <p>
              {students.length
                ? "Try another name, email, or filter to find who you’re looking for."
                : "Share a class and invite someone onto the mat. Their details will appear here when they book."}
            </p>
            {students.length ? (
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("Everyone");
                }}
              >
                Show everyone
              </button>
            ) : (
              <Link href="/dashboard/classes">
                Find a class to share <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-[#e8e0ee] bg-[#fffdf9]">
              {/* Column labels for the wider row layout. */}
              <div
                aria-hidden
                className="hidden grid-cols-[minmax(0,2fr)_90px_120px_minmax(0,1.5fr)_20px] gap-4 border-b border-[#e8e0ee] bg-[#f8f5fc] px-4 py-3 text-xs text-muted-foreground md:grid"
              >
                <span>Student</span>
                <span className="text-right">Classes</span>
                <span className="text-right">Spent</span>
                <span>Activity</span>
                <span />
              </div>
              <ul className="divide-y divide-[#eee8f2]">
                {shown.map((student, index) => (
                  <li key={student.email}>
                    <button
                      type="button"
                      onClick={() => setSelected(student)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fcfaff] active:bg-[#f8f5fc] md:grid md:grid-cols-[minmax(0,2fr)_90px_120px_minmax(0,1.5fr)_20px] md:gap-4"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          aria-hidden
                          className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatarTones[index % 3]}`}
                        >
                          {initials(student.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[0.95rem] font-medium">
                            {student.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            <span className="md:hidden">{activityLabel(student)}</span>
                            <span className="hidden md:inline">{student.email}</span>
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm tabular-nums">
                        {student.classesBooked}
                        <span className="text-muted-foreground md:hidden">
                          {" "}
                          {student.classesBooked === 1 ? "class" : "classes"}
                        </span>
                        {student.classesBooked > 1 ? (
                          <span className="block text-[10px] text-[#6e8060] md:hidden">
                            Returning
                          </span>
                        ) : null}
                      </span>
                      <span className="hidden text-right text-sm tabular-nums md:block">
                        {money(student.totalSpent, instructor.currency)}
                      </span>
                      <span className="hidden truncate text-sm text-muted-foreground md:block">
                        {activityLabel(student)}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {filtered.length > visible ? (
              <button
                type="button"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
                className="mx-auto mt-4 flex min-h-11 items-center rounded-full border border-[#e4ddec] px-5 text-sm text-[#5143dd] hover:bg-[#eeebff]"
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visible)} more ·{" "}
                {filtered.length - visible} left
              </button>
            ) : null}
          </>
        )}
      </section>

      <MobileSheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected?.email}
      >
        {selected ? (
          <>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <SheetStat label="Booked">{selected.classesBooked}</SheetStat>
              <SheetStat label="Attended">{selected.classesAttended}</SheetStat>
              <SheetStat label="Spent">{money(selected.totalSpent, instructor.currency)}</SheetStat>
            </dl>
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#f8f5fc] p-3 text-sm">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {selected.upcoming ? (
                <p>
                  <span className="block text-xs text-muted-foreground">Next on the mat</span>
                  <strong className="font-medium">{selected.upcoming.className}</strong>
                  <span className="block text-xs text-muted-foreground">
                    {formatClassDate(selected.upcoming)} · {formatClassTime(selected.upcoming)}
                  </span>
                </p>
              ) : (
                <p>
                  {activityLabel(selected)}
                  <span className="block text-xs text-muted-foreground">No upcoming booking</span>
                </p>
              )}
            </div>
            <div className="-mx-3 mt-3">
              <a href={`mailto:${selected.email}`} className={sheetActionClass}>
                <Mail className="size-5 text-muted-foreground" /> Email{" "}
                {selected.name.split(" ")[0]}
              </a>
              {selected.phone ? (
                <a href={`tel:${selected.phone}`} className={sheetActionClass}>
                  <Phone className="size-5 text-muted-foreground" /> Call {selected.phone}
                </a>
              ) : null}
              {/* wa.me needs a full international number, so only offer it
                  when the phone was saved with a country code. */}
              {selected.phone?.trim().startsWith("+") ? (
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={sheetActionClass}
                >
                  <MessageCircle className="size-5 text-muted-foreground" /> Message on WhatsApp
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </MobileSheet>
    </DashboardShell>
  );
}

function SheetStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse rounded-xl border border-border px-2 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-medium tabular-nums">{children}</dd>
    </div>
  );
}
