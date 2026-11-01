"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  ArrowUpRight,
  CalendarDays,
  Flower2,
  Sprout,
  HeartHandshake,
  Mail,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { money } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import type { StudentRow } from "./queries";
import styles from "./students.module.css";

const filters = ["Everyone", "Returning", "Upcoming class"] as const;
type Filter = (typeof filters)[number];

export function StudentsClient({ students }: { students: StudentRow[] }) {
  const instructor = useInstructor();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Everyone");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter(
      (student) =>
        (!q || student.name.toLowerCase().includes(q) || student.email.toLowerCase().includes(q)) &&
        (filter !== "Returning" || student.classesBooked > 1) &&
        (filter !== "Upcoming class" || student.upcoming !== null),
    );
  }, [students, query, filter]);
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
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className={styles["filters"]} role="group" aria-label="Filter students">
          {filters.map((value) => (
            <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value}
            </button>
          ))}
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
          <ul className={styles["list"]}>
            {filtered.map((student, index) => (
              <li key={student.email} className={styles["student"]}>
                <div className={styles["identity"]}>
                  <span className={styles["avatar"]} data-tone={index % 3} aria-hidden="true">
                    {student.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join("") || "S"}
                  </span>
                  <div>
                    <h3>{student.name}</h3>
                    <a href={`mailto:${student.email}`}>{student.email}</a>
                    {student.phone && <p>{student.phone}</p>}
                  </div>
                  <span className={styles["badge"]}>
                    {student.classesBooked > 1 ? "Returning" : "First booking"}
                  </span>
                </div>
                <dl className={styles["studentStats"]}>
                  <div>
                    <dt>Booked</dt>
                    <dd>{student.classesBooked}</dd>
                  </div>
                  <div>
                    <dt>Attended</dt>
                    <dd>{student.classesAttended}</dd>
                  </div>
                  <div>
                    <dt>Total spent</dt>
                    <dd>{money(student.totalSpent, instructor.currency)}</dd>
                  </div>
                </dl>
                <div className={styles["next"]}>
                  {student.upcoming ? (
                    <>
                      <CalendarDays size={17} aria-hidden="true" />
                      <div>
                        <span>Next on the mat</span>
                        <strong>{student.upcoming.className}</strong>
                        <p>
                          {formatClassDate(student.upcoming)} · {formatClassTime(student.upcoming)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Flower2 size={17} aria-hidden="true" />
                      <p>
                        {student.lastBookingAt
                          ? `Last class ${formatDistanceToNow(student.lastBookingAt, { addSuffix: true })}`
                          : "Their first class is taking shape"}
                        <span>No upcoming booking</span>
                      </p>
                    </>
                  )}
                </div>
                <a
                  className={styles["contact"]}
                  href={`mailto:${student.email}`}
                  aria-label={`Email ${student.name}`}
                >
                  <Mail size={16} /> Say hello <ArrowUpRight size={14} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
