"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side role guard for everything under /admin.
 *
 * The cookie-presence check in `middleware.ts` already redirects anonymous
 * users to /login. This component adds the second hop: a signed-in user
 * who is not an admin is bounced back to "/" with a toast.
 *
 * Kept as a tiny helper so individual admin pages can compose it cleanly.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      toast.error("Admin access required.");
      router.replace("/");
    }
  }, [status, isAdmin, router]);

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
