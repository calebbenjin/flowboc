import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionTable } from "./TransactionTable";
import {
  parseTransactionFilters,
  transactionPageHref,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_CURRENCIES,
  type TransactionParams,
} from "@/lib/transactions/filters";
import type { TransactionResult } from "@/lib/transactions/queries";

export function TransactionBrowser({
  result,
  params,
  path,
  admin = false,
}: {
  result: TransactionResult;
  params: TransactionParams;
  path: string;
  admin?: boolean;
}) {
  const filters = parseTransactionFilters(params);
  const anchor = admin ? "" : "#transactions";
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const input =
    "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-base sm:text-sm";
  const advanced = !!(
    filters.from ||
    filters.to ||
    filters.instructor ||
    filters.min !== null ||
    filters.max !== null
  );
  return (
    <div className="mt-6 space-y-5">
      <form
        action={`${path}${anchor}`}
        method="get"
        className="rounded-2xl border border-[#e0d8ed] bg-[#faf7ff] p-4 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium sm:col-span-2">
            Search transactions
            <input
              className={input}
              type="search"
              name="q"
              defaultValue={filters.q}
              maxLength={150}
              placeholder={
                admin
                  ? "Customer, item, instructor, reference, or ID"
                  : "Customer, item, reference, or ID"
              }
            />
          </label>
          <label className="text-xs font-medium">
            Type
            <select className={input} name="type" defaultValue={filters.type}>
              <option value="">All types</option>
              {TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "SESSION" ? "1:1 session" : type === "CLASS" ? "Class" : "Ebook"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Payment status
            <select className={input} name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {TRANSACTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
        <details open={advanced || undefined} className="mt-4">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-[#6355ff]">
            <SlidersHorizontal className="size-4" />
            Advanced filters
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-medium">
              Currency
              <select className={input} name="currency" defaultValue={filters.currency}>
                <option value="">All currencies</option>
                {TRANSACTION_CURRENCIES.map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">
              From date (UTC)
              <input className={input} type="date" name="from" defaultValue={filters.from} />
            </label>
            <label className="text-xs font-medium">
              Through date (UTC)
              <input className={input} type="date" name="to" defaultValue={filters.to} />
            </label>
            <label className="text-xs font-medium">
              Minimum amount
              <input
                className={input}
                type="number"
                min={0}
                step="0.01"
                name="min"
                defaultValue={filters.min ?? ""}
                placeholder="0"
              />
            </label>
            <label className="text-xs font-medium">
              Maximum amount
              <input
                className={input}
                type="number"
                min={0}
                step="0.01"
                name="max"
                defaultValue={filters.max ?? ""}
              />
            </label>
            {admin && (
              <label className="text-xs font-medium">
                Instructor
                <input
                  className={input}
                  name="instructor"
                  maxLength={150}
                  defaultValue={filters.instructor}
                  placeholder="Name, email, or instructor ID"
                />
              </label>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Date ranges include the whole end date in UTC. Amounts use each transaction’s recorded
            currency; select a currency to compare like for like.
          </p>
        </details>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[140px] flex-1 text-xs font-medium sm:flex-none">
            Sort
            <select className={input} name="sort" defaultValue={filters.sort}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Rows
            <select
              className={input}
              name="pageSize"
              defaultValue={String(
                [25, 50, 100].includes(filters.pageSize) ? filters.pageSize : 25,
              )}
            >
              {[25, 50, 100].map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </label>
          <Button type="submit" className="min-h-11">
            <Search className="size-4" /> Apply filters
          </Button>
          <Link
            href={`${path}${anchor}`}
            className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground underline"
          >
            Clear
          </Link>
        </div>
      </form>
      {result.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {result.errors.join(" ")}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>
          {result.total.toLocaleString()} {result.total === 1 ? "transaction" : "transactions"}
          {result.rows.length
            ? ` · Showing ${(result.page - 1) * result.pageSize + 1}–${(result.page - 1) * result.pageSize + result.rows.length}`
            : ""}
        </p>
        <p className="text-xs text-muted-foreground">Includes free bookings and downloads</p>
      </div>
      {result.rows.length ? (
        <TransactionTable rows={result.rows} admin={admin} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <h2 className="text-lg">
            {result.errors.length ? "Check your filters" : "No matching transactions"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.errors.length
              ? "Correct the filters above and try again."
              : "Try a broader search or clear the filters."}
          </p>
          <Link
            href={`${path}${anchor}`}
            className="mt-4 inline-flex min-h-11 items-center text-sm text-[#6355ff]"
          >
            Clear filters
          </Link>
        </div>
      )}
      <nav
        aria-label="Transaction pages"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        {result.page > 1 ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm"
            href={`${transactionPageHref(path, params, result.page - 1)}${anchor}`}
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        <span className="text-xs text-muted-foreground">
          Page {result.page} of {pages}
        </span>
        {result.page < pages ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm"
            href={`${transactionPageHref(path, params, result.page + 1)}${anchor}`}
          >
            Next
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Amounts, currencies, statuses, and processor fees come from recorded transactions. 1:1
        session and ebook names use the current offer title. A dash indicates an unrecorded fee.
      </p>
    </div>
  );
}
