import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import NextAuthSessionProvider from "./provider";
import { Toaster } from "sonner";
import { env } from "@/lib/env";

const outfit = Outfit({ subsets: ["latin"] });

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FixItNow — Book trusted home services near you",
    template: "%s | FixItNow",
  },
  description:
    "FixItNow connects you with verified home-service professionals — cleaning, plumbing, electrical, repairs and more. Discover, book and manage appointments in seconds.",
  keywords: [
    "home services",
    "book a plumber",
    "book an electrician",
    "house cleaning",
    "appliance repair",
    "FixItNow",
  ],
  openGraph: {
    title: "FixItNow — Book trusted home services near you",
    description:
      "Discover, book and manage trusted home-service professionals in your city.",
    url: siteUrl,
    siteName: "FixItNow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FixItNow",
    description:
      "Discover, book and manage trusted home-service professionals in your city.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <NextAuthSessionProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="mx-6 flex-1 md:mx-16">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="top-right" />
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
