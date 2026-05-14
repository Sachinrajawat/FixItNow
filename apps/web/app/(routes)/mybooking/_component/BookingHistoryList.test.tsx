import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BookingHistoryList, { shouldShowBooking } from "./BookingHistoryList";
import type { Booking, Business } from "@/types";

const FIXED_TODAY = new Date(2026, 4, 14); // 14 May 2026

const businessSparkle: Business = {
  id: "biz1",
  name: "Sparkle Cleaners",
  slug: "sparkle-cleaners",
  about: "Sparkly cleaning company",
  address: "123 Main St",
  contactPerson: "Anita",
  email: "sparkle@example.com",
  images: [],
  category: {
    id: "cat1",
    name: "Cleaning",
    slug: "cleaning",
    iconUrl: "https://example.com/clean.png",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  ratingAvg: 4.5,
  ratingCount: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const businessPipe: Business = {
  ...businessSparkle,
  id: "biz2",
  name: "Pipe Pros",
  slug: "pipe-pros",
  contactPerson: "Ravi",
  address: "456 Oak Ave",
};

const futureBooking: Booking = {
  id: "1",
  businessId: "biz1",
  userId: "u1",
  date: "2026-05-20",
  time: "10:00",
  status: "booked",
  business: businessSparkle,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const pastBooking: Booking = {
  id: "2",
  businessId: "biz2",
  userId: "u1",
  date: "2026-05-01",
  time: "14:30",
  status: "booked",
  business: businessPipe,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const cancelledBooking: Booking = {
  ...futureBooking,
  id: "3",
  status: "cancelled",
};

const malformedBooking = {
  ...futureBooking,
  id: "4",
  date: "not-a-date",
} as Booking;

describe("shouldShowBooking()", () => {
  it("includes only active future bookings under the 'booked' tab", () => {
    expect(shouldShowBooking(futureBooking, "booked", FIXED_TODAY)).toBe(true);
    expect(shouldShowBooking(pastBooking, "booked", FIXED_TODAY)).toBe(false);
    expect(shouldShowBooking(cancelledBooking, "booked", FIXED_TODAY)).toBe(
      false
    );
  });

  it("includes past, completed and cancelled bookings under 'completed'", () => {
    expect(shouldShowBooking(pastBooking, "completed", FIXED_TODAY)).toBe(true);
    expect(shouldShowBooking(cancelledBooking, "completed", FIXED_TODAY)).toBe(
      true
    );
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

  it("filters past bookings off the 'booked' tab", () => {
    render(
      <BookingHistoryList
        bookingHistory={[futureBooking, pastBooking]}
        type="booked"
      />
    );
    expect(screen.queryByText("Pipe Pros")).not.toBeInTheDocument();
  });
});
