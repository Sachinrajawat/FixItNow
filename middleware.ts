import { withAuth } from "next-auth/middleware";

// Protect routes that require an authenticated user.
// next-auth's `withAuth` automatically redirects unauthenticated users to
// the sign-in page configured below.
export default withAuth({
  pages: {
    signIn: "/api/auth/signin",
  },
});

export const config = {
  matcher: ["/mybooking/:path*", "/details/:path*"],
};
