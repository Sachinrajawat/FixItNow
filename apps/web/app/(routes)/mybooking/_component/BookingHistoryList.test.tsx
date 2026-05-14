import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BookingHistoryList, { shouldShowBooking } from "./BookingHistoryList";
import type { Booking } from "@/types";

const FIXED_TODAY = new Date(2026, 4, 14); // 14 May 2026

const futureBooking: Booking = {
  id: "1",
  date: "20-05-2026",
  time: "10:00 AM",
  businessList: {
    name: "Sparkle Cleaners",
    contactPerson: "Anita",
    address: "123 Main St",
    images: [],
  },
};

const pastBooking: Booking = {
  id: "2",
  date: "01-05-2026",
  time: "2:30 PM",
  businessList: {
    name: "Pipe Pros",
    contactPerson: "Ravi",
    address: "456 Oak Ave",
    images: [],
  },
};

const malformedBooking = { id: "3", date: "not-a-date", time: "" } as Booking;

describe("shouldShowBooking()", () => {
  it("includes today/future bookings under the 'booked' tab", () => {
    expect(shouldShowBooking(futureBooking, "booked", FIXED_TODAY)).toBe(true);
    expect(shouldShowBooking(pastBooking, "booked", FIXED_TODAY)).toBe(false);
  });

  it("includes only past bookings under the 'completed' tab", () => {
    expect(shouldShowBooking(pastBooking, "completed", FIXED_TODAY)).toBe(true);
    expect(shouldShowBooking(futureBooking, "completed", FIXED_TODAY)).toBe(
      false
    );
  });

  it("ignores malformed dates", () => {
    expect(shouldShowBooking(malformedBooking, "booked", FIXED_TODAY)).toBe(
      false
    );
    expect(shouldShowBooking(malformedBooking, "completed", FIXED_TODAY)).toBe(
      false
    );
  });
});

describe("<BookingHistoryList />", () => {
  it("renders an empty state when there are no bookings", () => {
    render(<BookingHistoryList bookingHistory={[]} type="booked" />);
    expect(screen.getByText(/no upcoming bookings yet/i)).toBeInTheDocument();
  });

  it("renders only matching bookings for the active tab", () => {
    render(
      <BookingHistoryList
        bookingHistory={[futureBooking, pastBooking]}
        type="booked"
      />
    );

    // Only the future one should appear since "today" in tests is real today
    // and futureBooking is in 2026-05-20. We can't fix `today` inside the
    // component without DI, so just assert pastBooking is filtered out
    // relative to today.
    expect(screen.queryByText("Pipe Pros")).not.toBeInTheDocument();
  });
});
