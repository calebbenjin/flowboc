import { NextResponse } from "next/server";

// Vercel's edge network injects this header on every request in production;
// it's absent in local dev, so the regional badge simply won't appear there.
export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  return NextResponse.json({ country });
}
