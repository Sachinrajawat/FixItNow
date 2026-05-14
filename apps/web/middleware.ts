import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware for route protection.
 *
 * The API issues an HttpOnly refresh cookie (`fin_rt`) on every successful
 * login. We do NOT validate the JWT here — that's the API's job — we just
 * gate access to authenticated pages on the *presence* of the cookie and
 * let the client transparently refresh on mount. If the cookie is missing
 * we bounce to /login?next=<intended path>.
 */
const REFRESH_COOKIE = "fin_rt";

export function middleware(req: NextRequest) {
  const hasRefreshCookie = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);
  if (hasRefreshCookie) return NextResponse.next();

  const url = req.nextUrl.clone();
  const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // /admin is also matched: this guard only verifies *authentication* —
  // the role check (admin only) is enforced by AdminGate inside the
  // /admin layout once the user has loaded.
  matcher: ["/mybooking/:path*", "/details/:path*", "/admin/:path*"],
};
