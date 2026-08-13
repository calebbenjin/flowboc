import { discountPercent, money } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  originalPrice,
  stacked = false,
  className,
  priceClassName = "display text-2xl",
}: {
  price: number;
  originalPrice?: number | undefined;
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
      <span className={priceClassName}>{money(price)}</span>
      {pct !== null && (
        <span className={cn("inline-flex items-baseline gap-2", stacked && "flex-row-reverse")}>
          <span className="rounded-full bg-clay/12 px-2 py-0.5 text-xs font-medium text-clay">
            {pct}% off
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {money(originalPrice!)}
          </span>
        </span>
      )}
    </span>
  );
}
