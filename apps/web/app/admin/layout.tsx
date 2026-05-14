import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdminGate } from "./AdminGate";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · FixItNow" },
  // Admin surfaces are auth-gated and only useful to operators; keep them
  // out of search engines entirely.
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/categories", label: "Categories" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 py-10">
        <header className="flex flex-col gap-2 border-b pb-4">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            FixItNow admin
          </p>
          <h1 className="text-3xl font-bold">Operations console</h1>
          <nav aria-label="Admin sections" className="mt-2 flex gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-primary text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </AdminGate>
  );
}
