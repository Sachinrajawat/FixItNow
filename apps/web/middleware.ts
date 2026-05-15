import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware.
 *
 * Previous design used the API's `fin_rt` HttpOnly refresh cookie as a
 * "are you logged in?" hint at the edge. That works on a single-origin
 * deployment (everything on localhost during dev) but **breaks in
 * production** when web is on Vercel and API is on Render: the cookie
 * is scoped to the API's origin and is never sent to Vercel, so the
 * middleware would redirect every authenticated user to /login on first
 * navigation to a protected page.
 *
 * The fix is to drop the cookie check at the edge and rely on the
 * client-side AuthGate / AdminGate components — they already know auth
 * state via the in-memory access token + silent refresh on boot, and
 * that works regardless of which origin set which cookie.
 *
 * We keep this file (rather than deleting it) as the single place to
 * add edge-level redirects/headers later — e.g. a same-origin Vercel
 * rewrite proxy that *would* make the cookie visible here.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Intentionally empty: client-side guards handle route protection.
  // See `apps/web/app/_components/AuthGate.tsx` for /mybooking and
  // `apps/web/app/admin/AdminGate.tsx` for /admin/*.
  matcher: [],
};
