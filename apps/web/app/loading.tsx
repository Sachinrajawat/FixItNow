export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading FixItNow"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
    >
      <div className="border-muted border-t-primary h-12 w-12 animate-spin rounded-full border-4" />
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}
