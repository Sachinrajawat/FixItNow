import { Calendar, Clock, MapPin, User, X } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Booking, BookingTabType } from "@/types";

interface BookingHistoryListProps {
  bookingHistory?: Booking[];
  type?: BookingTabType;
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
}

/**
 * Returns true if the booking belongs in the given tab.
 *
 * Tabs map to booking state:
 *   - "booked"    → status === "booked" AND date is today or later
 *   - "completed" → status === "completed" OR (status === "booked" AND
 *                   date is in the past) OR status === "cancelled"
 *
 * The function accepts an optional `today` for testability.
 *
 * Date format: YYYY-MM-DD (ISO calendar date, no TZ).
 */
export function shouldShowBooking(
  booking: Pick<Booking, "date" | "status">,
  type: BookingTabType,
  today: Date = new Date()
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(booking?.date ?? "");
  if (!match) return false;
  const [, yyyy, mm, dd] = match;

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const bookingDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));

  if (type === "booked") {
    return booking.status === "booked" && bookingDate >= startOfToday;
  }
  return booking.status !== "booked" || bookingDate < startOfToday;
}

/** Format YYYY-MM-DD for display, locale-aware, without timezone surprises. */
function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, yyyy, mm, dd] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format HH:MM 24h as locale time. */
function formatTime(hhmm: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) return hhmm;
  const [, hh, mm] = match;
  const d = new Date();
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const BookingHistoryList = ({
  bookingHistory = [],
  type = "booked",
  onCancel,
  cancellingId,
}: BookingHistoryListProps) => {
  const filtered = useMemo(
    () => bookingHistory.filter((b) => shouldShowBooking(b, type)),
    [bookingHistory, type]
  );

  if (filtered.length === 0) {
    return (
      <p className="text-muted-foreground mt-8 text-center text-sm">
        No {type === "booked" ? "upcoming" : "past"} bookings yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {filtered.map((booking) => {
        const biz = booking.business;
        const imageUrl = biz?.images?.[0]?.url;
        return (
          <article
            key={booking.id}
            className="mb-3 rounded-lg border p-4 transition hover:shadow-md"
          >
            <div className="flex gap-4">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={biz?.name ?? "Service image"}
                  width={120}
                  height={120}
                  unoptimized
                  className="h-[120px] w-[120px] rounded-lg object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="font-bold">{biz?.name ?? "Service"}</h3>
                <p className="text-primary flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {biz?.contactPerson ?? "—"}
                </p>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {biz?.address ?? "—"}
                </p>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="text-primary h-4 w-4" />
                  Date:{" "}
                  <span className="text-foreground">
                    {formatDate(booking.date)}
                  </span>
                </p>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="text-primary h-4 w-4" />
                  Time:{" "}
                  <span className="text-foreground">
                    {formatTime(booking.time)}
                  </span>
                </p>
                {booking.status === "cancelled" && (
                  <span className="text-destructive text-xs font-medium">
                    Cancelled
                  </span>
                )}
                {type === "booked" && onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-fit"
                    disabled={cancellingId === booking.id}
                    onClick={() => onCancel(booking.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {cancellingId === booking.id
                      ? "Cancelling…"
                      : "Cancel booking"}
                  </Button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default BookingHistoryList;
