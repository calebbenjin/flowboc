import { discountPercent, money, type CurrencyCode } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  originalPrice,
  currency,
  stacked = false,
  className,
  priceClassName = "display text-xl",
}: {
  price: number;
  originalPrice?: number | undefined;
  currency: CurrencyCode;
  stacked?: boolean;
  className?: string;
  priceClassName?: string;
}) {
  const pct = discountPercent({ price, originalPrice });

  return (
    <span
      className={cn(
        "inline-flex flex-wrap gap-2",
        stacked ? "flex-col items-end" : "items-baseline",
        className,
      )}
    >
      <span className={priceClassName}>{money(price, currency)}</span>
      {pct !== null && (
        <span className={cn("inline-flex items-baseline gap-2", stacked && "flex-row-reverse")}>
          <span className="text-sm text-muted-foreground line-through">
            {money(originalPrice!, currency)}
          </span>
          <span className="rounded-xs bg-clay/20 px-2 py-0.5 text-xs font-medium text-clay">
            {pct}% OFF
          </span>
        </span>
      )}
    </span>
  );
}
