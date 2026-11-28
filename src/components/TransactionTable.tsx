import { money } from "@/lib/demo";
import type { TransactionRow } from "@/lib/transactions/queries";
import { StatusPill, paymentTone } from "@/components/StatusPill";
import { TransactionList } from "@/components/TransactionList";
const typeLabels = { CLASS: "Class", SESSION: "1:1 session", EBOOK: "Ebook" };
export function TransactionTable({
  rows,
  admin = false,
  compact = false,
}: {
  rows: TransactionRow[];
  admin?: boolean;
  compact?: boolean;
}) {
  return (
    <>
      {/* Phones get a tappable list; the full table starts at md. */}
      <div className="md:hidden">
        <TransactionList rows={rows} admin={admin} />
      </div>
      <TransactionGrid rows={rows} admin={admin} compact={compact} />
    </>
  );
}

function TransactionGrid({
  rows,
  admin,
  compact,
}: {
  rows: TransactionRow[];
  admin: boolean;
  compact: boolean;
}) {
  return (
    <div
      role="region"
      aria-label="Transaction table, scroll horizontally for more columns"
      tabIndex={0}
      className="hidden min-w-0 max-w-full overflow-x-auto rounded-2xl md:block border border-border bg-white focus-visible:outline-2 focus-visible:outline-primary"
    >
      <table className={`w-full ${compact ? "min-w-[600px]" : "min-w-[840px]"} text-left text-sm`}>
        <caption className="sr-only">
          Class bookings, 1:1 sessions, and ebook transactions. Dates are shown in UTC.
        </caption>
        <thead className="border-b border-border bg-[#f8f5fc] text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-4 font-medium">
              Customer
            </th>
            <th scope="col" className="px-4 py-4 font-medium">
              Item / type
            </th>
            {admin && (
              <th scope="col" className="px-4 py-4 font-medium">
                Instructor
              </th>
            )}
            <th scope="col" className="px-4 py-4 text-right font-medium">
              Amount
            </th>
            {!compact && (
              <th scope="col" className="px-4 py-4 text-right font-medium">
                Processor fee
              </th>
            )}
            <th scope="col" className="px-4 py-4 font-medium">
              Payment status
            </th>
            {!compact && (
              <th scope="col" className="px-4 py-4 font-medium">
                Reference
              </th>
            )}
            <th scope="col" className="px-4 py-4 font-medium">
              Date (UTC)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={`${row.type}:${row.id}`} className="align-top hover:bg-[#fcfaff]">
              <td className="px-4 py-4">
                <span className="block font-medium">{row.name || "Guest"}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{row.email}</span>
              </td>
              <td className="max-w-[240px] px-4 py-4">
                <span className="block break-words">{row.title}</span>
                <span className="mt-1 block text-xs text-[#6355ff]">{typeLabels[row.type]}</span>
              </td>
              {admin && (
                <td className="px-4 py-4">
                  <span className="block">{row.instructorName}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {row.instructorEmail}
                  </span>
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                <span className="block font-medium">
                  {row.currency
                    ? money(row.amount, row.currency)
                    : row.amount === 0
                      ? "Free"
                      : row.amount.toLocaleString("en-US")}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {row.currency ?? "Currency not recorded"}
                  {row.amount === 0 ? " · Free" : ""}
                </span>
              </td>
              {!compact && (
                <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                  {row.fee === null
                    ? "—"
                    : row.currency
                      ? money(row.fee, row.currency)
                      : row.fee.toLocaleString("en-US")}
                </td>
              )}
              <td className="px-4 py-4">
                <StatusPill tone={paymentTone(row.status.toLowerCase())}>
                  {row.status.toLowerCase()}
                </StatusPill>
              </td>
              {!compact && (
                <td className="max-w-[190px] px-4 py-4">
                  <span className="block break-all font-mono text-[11px]">
                    {row.reference ?? "No payment reference"}
                  </span>
                  <span className="mt-1 block break-all text-[10px] text-muted-foreground">
                    ID: {row.id}
                  </span>
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">
                <time dateTime={row.date.toISOString()}>
                  {new Intl.DateTimeFormat("en-GB", {
                    timeZone: "UTC",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }).format(row.date)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
