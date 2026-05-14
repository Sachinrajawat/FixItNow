import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        404
      </p>
      <h1 className="text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you are looking for might have been moved, renamed, or never
        existed.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
