import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth) {
    const authUrl = new URL("/auth", req.nextUrl.origin);
    return Response.redirect(authUrl);
  }

  if (req.nextUrl.pathname.startsWith("/admin") && req.auth.user.role !== "ADMIN") {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return Response.redirect(dashboardUrl);
  }

  return undefined;
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/admin/:path*"],
  runtime: "nodejs",
};
