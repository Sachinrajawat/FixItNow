import { Calendar, Clock, MapPin, User } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import type { Booking, BookingTabType } from "@/types";

interface BookingHistoryListProps {
  bookingHistory?: Booking[];
  type?: BookingTabType;
}

/**
 * Returns true if the booking's date (DD-MM-YYYY) falls into the requested
 * tab — "booked" = today or later, "completed" = strictly before today.
 *
 * Exported for unit testing.
 */
export function shouldShowBooking(
  booking: Pick<Booking, "date">,
  type: BookingTabType,
  today: Date = new Date()
): boolean {
  const [dd, mm, yyyy] = (booking?.date || "").split("-").map(Number);
  if (!dd || !mm || !yyyy) return false;

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const bookingDate = new Date(yyyy, mm - 1, dd);
  return type === "booked"
    ? bookingDate >= startOfToday
    : bookingDate < startOfToday;
}

const BookingHistoryList = ({
  bookingHistory = [],
  type = "booked",
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
      {filtered.map((booking) => (
        <article
          key={booking.id}
          className="mb-3 rounded-lg border p-4 transition hover:shadow-md"
        >
          <div className="flex gap-4">
            {booking?.businessList?.images?.[0]?.url && (
              <Image
                src={booking.businessList.images[0].url}
                alt={booking.businessList.name || "Service image"}
                width={120}
                height={120}
                className="h-[120px] w-[120px] rounded-lg object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <h3 className="font-bold">{booking?.businessList?.name}</h3>
              <p className="text-primary flex items-center gap-2">
                <User className="h-4 w-4" />
                {booking?.businessList?.contactPerson}
              </p>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" /> {booking?.businessList?.address}
              </p>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="text-primary h-4 w-4" />
                Date: <span className="text-foreground">{booking.date}</span>
              </p>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="text-primary h-4 w-4" />
                Time: <span className="text-foreground">{booking.time}</span>
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default BookingHistoryList;
