"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side role guard for everything under /admin.
 *
 * Edge middleware can't reliably gate authentication in a cross-origin
 * deployment (Vercel web + Render API), so this gate has to handle BOTH
 * unauthenticated and authenticated-but-not-admin in one place:
 *
 *   loading                          → spinner
 *   unauthenticated                  → /login?next=<current path>
 *   authenticated, role !== "admin"  → "/" + toast
 *   authenticated, role === "admin"  → children
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === "authenticated" && !isAdmin) {
      toast.error("Admin access required.");
      router.replace("/");
    }
  }, [status, isAdmin, router, pathname]);

  if (status === "loading") {
    return (
      <div
        role="status"
        className="flex min-h-[40vh] items-center justify-center"
      >
        <div className="border-muted border-t-primary h-10 w-10 animate-spin rounded-full border-4" />
        <span className="sr-only">Checking permissions…</span>
      </div>
    );
  }

  if (status !== "authenticated" || !isAdmin) {
    return (
      <p
        className="text-muted-foreground py-20 text-center text-sm"
        role="status"
      >
        Redirecting…
      </p>
    );
  }

  return <>{children}</>;
}
