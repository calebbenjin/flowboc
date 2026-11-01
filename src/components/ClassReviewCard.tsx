import { CalendarDays, Clock3, MapPin, Video } from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import { draftToPreviewClass } from "@/lib/class-form-preview";
import type { CurrencyCode } from "@/lib/demo";

export function ClassReviewCard({
  values,
  currency,
  scope,
}: {
  values: Record<string, string>;
  currency: CurrencyCode;
  scope: string;
}) {
  const preview = draftToPreviewClass(
    {
      name: values["name"] ?? "",
      coverUrl: values["coverUrl"] || null,
      date: values["date"] ?? "",
      time: values["time"] ?? "",
      timezone: values["timezone"] ?? "",
      price: Number(values["price"] || 0),
      originalPrice: values["originalPrice"] ? Number(values["originalPrice"]) : null,
    },
    currency,
  );
  const online = values["online"] === "true";
  const LocationIcon = online ? Video : MapPin;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {preview.coverUrl ? (
        <img
          src={preview.coverUrl}
          alt={preview.name}
          className="aspect-[16/7] max-h-44 w-full object-cover"
        />
      ) : null}
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-56">
            {values["type"] ? (
              <p className="mb-2 text-xs font-medium text-muted-foreground">{values["type"]}</p>
            ) : null}
            <h3 className="break-words text-2xl leading-tight sm:text-3xl">{preview.name}</h3>
          </div>
          <PriceTag
            price={preview.price}
            originalPrice={preview.originalPrice ?? undefined}
            currency={currency}
            priceClassName="display text-2xl"
            className="pt-0.5"
          />
        </div>

        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-3">
            <CalendarDays
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>{preview.dateLabel}</span>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {values["durationMinutes"]} minutes · {values["timezone"]}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <LocationIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 break-words">
              {online ? "Online class" : values["location"] || "Location not set"}
              {online ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {values["location"] || "Meeting link not set"}
                </span>
              ) : null}
            </span>
          </li>
        </ul>
        {values["description"] ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
            {values["description"]}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border bg-sand/35 p-5 sm:px-6">
        <h4 className="font-sans text-sm font-semibold">Booking details</h4>
        <dl className="mt-3 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Class capacity</dt>
            <dd className="mt-1 font-medium">{values["capacity"]} students</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Booking closes</dt>
            <dd className="mt-1 font-medium">{values["deadline"]}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Cancellation policy</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
              {values["cancellationPolicy"] || "No cancellation policy set"}
            </dd>
          </div>
        </dl>
      </div>
      <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">
        {scope}
      </p>
    </article>
  );
}
