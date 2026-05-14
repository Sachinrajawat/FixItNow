"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingHistoryList from "./_component/BookingHistoryList";
import { api, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { Booking } from "@/types";

const MyBooking = () => {
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { status } = useAuth();

  const fetchBookings = useCallback(
    (signal?: AbortSignal) => {
      if (status !== "authenticated") return;
      setLoading(true);
      api.bookings
        .mine({ page: 1, limit: 50 }, signal)
        .then((res) => {
          if (signal?.aborted) return;
          setBookingHistory(res.items);
        })
        .catch((err: unknown) => {
          if (signal?.aborted) return;
          console.error("Failed to load bookings", err);
          setBookingHistory([]);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [status]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBookings(controller.signal);
    return () => controller.abort();
  }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await api.bookings.cancel(id);
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Could not cancel booking. Please try again.");
      }
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-5 my-10 md:mx-36">
      <h1 className="my-2 text-[20px] font-bold">My bookings</h1>
      <Tabs defaultValue="booked" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="booked">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="booked">
          {loading ? (
            <p className="text-muted-foreground mt-8 text-center text-sm">
              Loading…
            </p>
          ) : (
            <BookingHistoryList
              bookingHistory={bookingHistory}
              type="booked"
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          )}
        </TabsContent>
        <TabsContent value="completed">
          {loading ? (
            <p className="text-muted-foreground mt-8 text-center text-sm">
              Loading…
            </p>
          ) : (
            <BookingHistoryList
              bookingHistory={bookingHistory}
              type="completed"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBooking;
