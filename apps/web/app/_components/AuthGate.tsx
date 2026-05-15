"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side authentication guard for pages that require a signed-in
 * user (e.g. /mybooking).
 *
 * Cross-origin cookie limitations make edge middleware unreliable for
 * this in a Vercel-web + Render-API deployment (the API's HttpOnly
 * refresh cookie lives on the API origin and is never sent to Vercel),
 * so the guard runs here against the in-memory auth context.
 *
 *   loading          → spinner
 *   unauthenticated  → /login?next=<current path>
 *   authenticated    → children
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div
        role="status"
        className="flex min-h-[40vh] items-center justify-center"
      >
        <div className="border-muted border-t-primary h-10 w-10 animate-spin rounded-full border-4" />
        <span className="sr-only">Checking session…</span>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <p
        className="text-muted-foreground py-20 text-center text-sm"
        role="status"
      >
        Redirecting to login…
      </p>
    );
  }

  return <>{children}</>;
}
