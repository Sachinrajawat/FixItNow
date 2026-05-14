import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Sign in / Sign up", template: "%s | FixItNow" },
  description:
    "Sign in to FixItNow or create an account to discover and book trusted home-service professionals.",
  robots: {
    // The login + signup pages are functional but low SEO value; index them
    // so the brand surfaces but don't waste crawl budget on snippets.
    index: true,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
