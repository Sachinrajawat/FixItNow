"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingHistoryList from "./_component/BookingHistoryList";
import GlobalApi from "@/app/_services/GlobalApi";
import { useSession } from "next-auth/react";

const MyBooking = () => {
  const [bookingHistory, setBookingHistory] = useState([]);
  const { data, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.email) return;

    let cancelled = false;
    GlobalApi.GetUserBookingHistory(data.user.email)
      .then((res) => {
        if (!cancelled) setBookingHistory(res?.bookings || []);
      })
      .catch((err) => {
        console.error("Failed to load bookings", err);
        if (!cancelled) setBookingHistory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [status, data?.user?.email]);

  return (
    <div className="mx-5 my-10 md:mx-36">
      <h1 className="my-2 text-[20px] font-bold">My bookings</h1>
      <Tabs defaultValue="booked" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="booked">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="booked">
          <BookingHistoryList bookingHistory={bookingHistory} type="booked" />
        </TabsContent>
        <TabsContent value="completed">
          <BookingHistoryList
            bookingHistory={bookingHistory}
            type="completed"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBooking;
