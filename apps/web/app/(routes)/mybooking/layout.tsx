import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My bookings",
  description: "View and manage your upcoming and past FixItNow appointments.",
  robots: { index: false, follow: false },
};

export default function MyBookingLayout({ children }: { children: ReactNode }) {
  return children;
}
