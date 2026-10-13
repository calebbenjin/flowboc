// Shared guard for Vercel cron routes. Comparing against a template string
// directly (`Bearer ${process.env.CRON_SECRET}`) fails open if the env var
// is ever unset, since the expected value becomes the literal string
// "Bearer undefined" — anyone sending that header would pass.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env["CRON_SECRET"];
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
