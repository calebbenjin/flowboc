"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { money } from "@/lib/demo";
import type { TransactionRow } from "@/lib/transactions/queries";
import { StatusPill, paymentTone } from "@/components/StatusPill";
import { MobileSheet } from "@/components/MobileSheet";

const typeLabels = { CLASS: "Class", SESSION: "1:1 session", EBOOK: "Ebook" };

// Dates match the desktop table, which shows UTC.
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const shortDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});
const fullDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function amountLabel(row: TransactionRow, value = row.amount) {
  if (row.currency) return money(value, row.currency);
  return value === 0 ? "Free" : value.toLocaleString("en-US");
}

function dayLabel(key: string, now: Date) {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return shortDate.format(new Date(`${key}T00:00:00Z`));
}

// Phone layout for transactions: one row per payment grouped by day, with
// the fee, reference and full timestamp in a bottom sheet.
export function TransactionList({
  rows,
  admin = false,
}: {
  rows: TransactionRow[];
  admin?: boolean;
}) {
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const now = new Date();

  const groups: { key: string; rows: TransactionRow[] }[] = [];
  for (const row of rows) {
    const key = dayKey(row.date);
    const last = groups.at(-1);
    if (last?.key === key) last.rows.push(row);
    else groups.push({ key, rows: [row] });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
            {dayLabel(group.key, now)}
          </h3>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {group.rows.map((row) => (
              <li key={`${row.type}:${row.id}`}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[#f8f5fc]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.95rem] font-medium">
                      {row.name || "Guest"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {row.title} · {typeLabels[row.type]}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[0.95rem] font-medium tabular-nums">
                      {amountLabel(row)}
                    </span>
                    <StatusPill tone={paymentTone(row.status.toLowerCase())}>
                      {row.status.toLowerCase()}
                    </StatusPill>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <MobileSheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? amountLabel(selected) : ""}
        description={selected ? `${selected.name || "Guest"} · ${selected.title}` : undefined}
      >
        {selected ? (
          <dl className="divide-y divide-border text-sm">
            <Detail label="Status">
              <StatusPill tone={paymentTone(selected.status.toLowerCase())}>
                {selected.status.toLowerCase()}
              </StatusPill>
            </Detail>
            <Detail label="Type">{typeLabels[selected.type]}</Detail>
            <Detail label="Customer">
              <span className="block">{selected.name || "Guest"}</span>
              <span className="block break-all text-xs text-muted-foreground">
                {selected.email}
              </span>
            </Detail>
            {admin ? (
              <Detail label="Instructor">
                <span className="block">{selected.instructorName}</span>
                <span className="block break-all text-xs text-muted-foreground">
                  {selected.instructorEmail}
                </span>
              </Detail>
            ) : null}
            <Detail label="Processor fee">
              {selected.fee === null ? "—" : amountLabel(selected, selected.fee)}
            </Detail>
            <Detail label="Currency">{selected.currency ?? "Not recorded"}</Detail>
            <Detail label="Date (UTC)">
              <time dateTime={selected.date.toISOString()}>{fullDate.format(selected.date)}</time>
            </Detail>
            <Detail label="Reference">
              <span className="break-all font-mono text-xs">
                {selected.reference ?? "No payment reference"}
              </span>
            </Detail>
            <Detail label="ID">
              <span className="break-all font-mono text-xs">{selected.id}</span>
            </Detail>
          </dl>
        ) : null}
      </MobileSheet>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
