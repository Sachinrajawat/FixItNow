"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import type { Business } from "@/types";
import { useRouter } from "next/navigation";

interface TimeSlot {
  /** Submitted to the API (HH:MM 24h). */
  value: string;
  /** Displayed in the UI (e.g. "10:00 AM"). */
  label: string;
}

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  // 10:00 AM – 6:30 PM every 30 mins (matches the previous UX).
  for (let h = 10; h <= 18; h++) {
    for (const m of [0, 30] as const) {
      if (h === 18 && m === 30) continue;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const meridiem = h < 12 ? "AM" : "PM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${hour12}:${String(m).padStart(2, "0")} ${meridiem}`;
      slots.push({ value, label });
    }
  }
  return slots;
};

/** Format a Date in the user's locale as YYYY-MM-DD (no TZ shift). */
const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface BookingSectionProps {
  business: Business;
  children: ReactNode;
}

const BookingSection = ({ business, children }: BookingSectionProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { status } = useAuth();
  const router = useRouter();

  const timeSlots = useMemo(generateTimeSlots, []);

  const fetchBookedSlots = useCallback(
    (controller: AbortController) => {
      if (!business?.id || !date) return;
      api.bookings
        .slots(business.id, toIsoDate(date), controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) setBookedSlots(res.slots);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Failed to load booked slots", err);
          setBookedSlots([]);
        });
    },
    [business?.id, date]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBookedSlots(controller);
    return () => controller.abort();
  }, [fetchBookedSlots]);

  const isBooked = useCallback(
    (value: string) => bookedSlots.includes(value),
    [bookedSlots]
  );

  const saveBooking = async () => {
    if (status !== "authenticated") {
      router.push(
        `/login?next=${encodeURIComponent(`/details/${business.id}`)}`
      );
      return;
    }
    if (!date || !selectedTime) {
      toast.error("Please pick a date and a time slot.");
      return;
    }

    try {
      setSubmitting(true);
      await api.bookings.create({
        businessId: business.id,
        date: toIsoDate(date),
        time: selectedTime,
      });
      setDate(new Date());
      setSelectedTime("");
      toast.success("Booking confirmed!");
      const controller = new AbortController();
      fetchBookedSlots(controller);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("That slot was just booked. Please pick another time.");
      } else {
        console.error("Booking error:", err);
        toast.error("Could not complete the booking. Please try again.");
      }
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
              onSelect={setDate}
              disabled={{ before: new Date() }}
              className="rounded-md border"
            />
          </div>

          <div className="mt-6">
            <h3 className="mb-3 font-bold">Select time slot</h3>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => {
                const booked = isBooked(slot.value);
                const active = selectedTime === slot.value;
                return (
                  <Button
                    key={slot.value}
                    type="button"
                    variant="outline"
                    disabled={booked}
                    aria-pressed={active}
                    className={`rounded-full border p-2 px-3 ${
                      active ? "bg-primary text-white" : ""
                    }`}
                    onClick={() => setSelectedTime(slot.value)}
                  >
                    {slot.label}
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
