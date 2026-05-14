"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import GlobalApi from "@/app/_services/GlobalApi";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import moment from "moment";

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 10; i <= 12; i++) {
    slots.push({ time: `${i}:00 AM` });
    slots.push({ time: `${i}:30 AM` });
  }
  for (let i = 1; i <= 6; i++) {
    slots.push({ time: `${i}:00 PM` });
    slots.push({ time: `${i}:30 PM` });
  }
  return slots;
};

const BookingSection = ({ children, business }) => {
  const [date, setDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { data } = useSession();

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const fetchBookedSlots = useCallback(() => {
    if (!business?.id || !date) return;
    GlobalApi.BusinessBookedSlot(business.id, moment(date).format("DD-MM-YYYY"))
      .then((res) => setBookedSlots(res.bookings || []))
      .catch((err) => {
        console.error("Failed to load booked slots", err);
        setBookedSlots([]);
      });
  }, [business?.id, date]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const isBooked = useCallback(
    (time) => bookedSlots.some((item) => item.time === time),
    [bookedSlots]
  );

  const saveBooking = async () => {
    if (!data?.user?.email) {
      toast.error("Please sign in before booking.");
      return;
    }
    if (!date || !selectedTime) {
      toast.error("Please pick a date and a time slot.");
      return;
    }

    try {
      setSubmitting(true);
      await GlobalApi.createNewBooking(
        business.id,
        moment(date).format("DD-MM-YYYY"),
        selectedTime,
        data.user.email,
        data.user.name
      );
      setDate(new Date());
      setSelectedTime("");
      toast.success("Booking confirmed!");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Could not complete the booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="overflow-auto">
          <SheetHeader>
            <SheetTitle>Book a service</SheetTitle>
            <SheetDescription>
              Select a date and time slot to book this service.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-col items-baseline gap-5">
            <h3 className="font-bold">Select date</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => setDate(d)}
              disabled={{ before: new Date() }}
              className="rounded-md border"
            />
          </div>

          <div className="mt-6">
            <h3 className="mb-3 font-bold">Select time slot</h3>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((item) => {
                const booked = isBooked(item.time);
                const active = selectedTime === item.time;
                return (
                  <Button
                    key={item.time}
                    type="button"
                    variant="outline"
                    disabled={booked}
                    aria-pressed={active}
                    className={`rounded-full border p-2 px-3 ${
                      active ? "bg-primary text-white" : ""
                    }`}
                    onClick={() => setSelectedTime(item.time)}
                  >
                    {item.time}
                  </Button>
                );
              })}
            </div>
          </div>

          <SheetFooter className="mt-6">
            <div className="flex gap-3">
              <SheetClose asChild>
                <Button variant="destructive">Cancel</Button>
              </SheetClose>
              <Button
                disabled={!selectedTime || !date || submitting}
                onClick={saveBooking}
              >
                {submitting ? "Booking…" : "Book"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BookingSection;
