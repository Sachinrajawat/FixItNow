"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/auth-context";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/search/Cleaning", label: "Services" },
  { href: "/about", label: "About" },
];

const Header = () => {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : (pathname ?? "").startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-8">
        <Link
          href="/"
          aria-label="FixItNow home"
          className="flex items-center gap-2"
        >
          <Image src="/logo.png" alt="FixItNow logo" width={42} height={42} />
          <span className="text-primary hidden text-lg font-bold sm:inline">
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
              className={`hover:text-primary text-sm font-medium transition ${
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
            className="bg-muted h-10 w-24 animate-pulse rounded-md"
            aria-hidden="true"
          />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open user menu"
                className="ring-offset-background focus:ring-ring rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <Image
                  src={user.image || "/logo.png"}
                  alt={user.name || "Profile picture"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name || "My Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/mybooking">My bookings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
