import { NextResponse } from "next/server";
import { paystackCurrencyForCountry } from "@/lib/geo-pricing";
import { getActivePlan } from "@/lib/subscription-plans";

// Vercel's edge network injects this header on every request in production;
// it's absent in local dev, so the regional badge simply won't appear there.
export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");

  const currency = paystackCurrencyForCountry(country);
  const plan = currency ? await getActivePlan(currency, "MONTHLY") : null;

  return NextResponse.json({
    country,
    local: plan ? { currency, price: plan.price } : null,
  });
}
