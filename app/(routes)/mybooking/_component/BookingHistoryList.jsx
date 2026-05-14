import { Calendar, Clock, MapPin, User } from "lucide-react";
import Image from "next/image";
import React, { useMemo } from "react";

const BookingHistoryList = ({ bookingHistory = [], type = "booked" }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filtered = useMemo(() => {
    return bookingHistory.filter((item) => {
      // `item.date` is stored as DD-MM-YYYY (see BookingSection).
      const [dd, mm, yyyy] = (item?.date || "").split("-").map(Number);
      if (!dd || !mm || !yyyy) return false;
      const bookingDate = new Date(yyyy, mm - 1, dd);
      return type === "booked" ? bookingDate >= today : bookingDate < today;
    });
  }, [bookingHistory, type, today]);

  if (filtered.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-muted-foreground">
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
              <p className="flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                {booking?.businessList?.contactPerson}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {booking?.businessList?.address}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Date: <span className="text-foreground">{booking.date}</span>
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
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
