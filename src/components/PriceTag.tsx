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
        "inline-flex flex-wrap gap-1",
        stacked ? "flex-col items-end relative" : "items-baseline",
        className,
      )}
    >
      <span className={priceClassName}>{money(price, currency)}</span>
      {pct !== null && (
        <span className={cn("inline-flex items-baseline gap-2", stacked && "flex-row-reverse")}>
          <span className="text-xs text-muted-foreground line-through">
            {money(originalPrice!, currency)}
          </span>
          <span className="rounded-xs bg-clay/20 px-1 py-0.5 text-[0.6rem] whitespace-nowrap font-medium text-clay ">
            {pct}% OFF
          </span>
        </span>
      )}
    </span>
  );
}
