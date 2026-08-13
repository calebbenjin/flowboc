import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth) {
    const authUrl = new URL("/auth", req.nextUrl.origin);
    return Response.redirect(authUrl);
  }
  return undefined;
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
  runtime: "nodejs",
};
