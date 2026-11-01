export type TransactionParams = Record<string, string | string[] | undefined>;
export const TRANSACTION_TYPES = ["CLASS", "SESSION", "EBOOK"] as const;
export const TRANSACTION_STATUSES = ["PAID", "PENDING", "FAILED", "REFUNDED", "CANCELLED"] as const;
export const TRANSACTION_CURRENCIES = [
  "USD",
  "NGN",
  "GBP",
  "EUR",
  "ZAR",
  "KES",
  "GHS",
  "XOF",
] as const;
export function parseTransactionFilters(params: TransactionParams) {
  const read = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  };
  const errors: string[] = [];
  const type = read("type"),
    status = read("status"),
    currency = read("currency"),
    from = read("from"),
    to = read("to");
  if (type && !TRANSACTION_TYPES.includes(type as (typeof TRANSACTION_TYPES)[number]))
    errors.push("Choose a valid transaction type.");
  if (status && !TRANSACTION_STATUSES.includes(status as (typeof TRANSACTION_STATUSES)[number]))
    errors.push("Choose a valid payment status.");
  if (
    currency &&
    !TRANSACTION_CURRENCIES.includes(currency as (typeof TRANSACTION_CURRENCIES)[number])
  )
    errors.push("Choose a valid currency.");
  const date = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
      ? parsed
      : null;
  };
  const start = from ? date(from) : null,
    end = to ? date(to) : null;
  if ((from && !start) || (to && !end)) errors.push("Enter valid dates.");
  if (start && end && start > end) errors.push("The start date must come before the end date.");
  const amount = (key: string) => {
    const raw = read(key);
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
      errors.push("Amounts must be positive numbers or zero.");
      return null;
    }
    return value;
  };
  const min = amount("min"),
    max = amount("max");
  if (min !== null && max !== null && min > max)
    errors.push("The minimum amount must not exceed the maximum.");
  const positiveInt = (value: string, fallback: number, maximum: number) =>
    /^\d+$/.test(value) && Number(value) > 0 && Number.isSafeInteger(Number(value))
      ? Math.min(Number(value), maximum)
      : fallback;
  return {
    q: read("q").slice(0, 150),
    instructor: read("instructor").slice(0, 150),
    type,
    status,
    currency,
    from,
    to,
    start,
    endExclusive: end ? new Date(end.getTime() + 86400000) : null,
    min,
    max,
    sort: read("sort") === "oldest" ? "oldest" : "newest",
    page: positiveInt(read("page"), 1, 1000000),
    pageSize: positiveInt(read("pageSize"), 25, 100),
    errors,
  };
}
export function transactionPageHref(path: string, params: TransactionParams, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first && key !== "page") search.set(key, first);
  }
  search.set("page", String(page));
  return `${path}?${search.toString()}`;
}
