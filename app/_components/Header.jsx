"use client";

import { Button } from "@/components/ui/button";
import { signIn, useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search/Cleaning", label: "Services" },
  { href: "/about", label: "About" },
];

const Header = () => {
  const { data, status } = useSession();
  const pathname = usePathname();

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-8">
        <Link
          href="/"
          aria-label="FixItNow home"
          className="flex items-center gap-2"
        >
          <Image src="/logo.png" alt="FixItNow logo" width={42} height={42} />
          <span className="hidden text-lg font-bold text-primary sm:inline">
            FixItNow
          </span>
        </Link>
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-primary ${
                isActive(link.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {status === "loading" ? (
          <div
            className="h-10 w-24 animate-pulse rounded-md bg-muted"
            aria-hidden="true"
          />
        ) : data?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open user menu"
                className="rounded-full ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Image
                  src={data.user.image || "/logo.png"}
                  alt={data.user.name || "Profile picture"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {data.user.name || "My Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/mybooking">My bookings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-destructive focus:text-destructive"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => signIn("descope")}>Login / Sign up</Button>
        )}
      </div>
    </header>
  );
};

export default Header;
