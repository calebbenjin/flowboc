import { currencyForCountry } from "@/lib/billing-currency";

// Lets the statically rendered landing page pick a default pricing currency
// from the visitor's location without reading request headers itself (which
// would make every landing-page hit render dynamically). Null outside the
// countries we bill in — the page then keeps its own default.
export function GET(req: Request) {
  const currency = currencyForCountry(req.headers.get("x-vercel-ip-country"));
  return Response.json({ currency }, { headers: { "Cache-Control": "private, no-store" } });
}
