import { Router } from "express";
import {
  bookedSlotsQuerySchema,
  bookingIdParamSchema,
  bookingListMineQuerySchema,
  createBookingBodySchema,
} from "@fixitnow/types";

import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import {
  cancelBooking,
  createBooking,
  listBookedSlots,
  listMyBookings,
} from "../controllers/bookings.controller";

const router = Router();

// Public — used by the booking UI to render greyed-out time slots.
router.get(
  "/slots",
  validate({ query: bookedSlotsQuerySchema }),
  listBookedSlots
);

router.get(
  "/mine",
  requireAuth,
  validate({ query: bookingListMineQuerySchema }),
  listMyBookings
);

router.post(
  "/",
  requireAuth,
  rateLimit({ name: "bookings.create", max: 20, windowSec: 60 }),
  validate({ body: createBookingBodySchema }),
  createBooking
);

router.patch(
  "/:id/cancel",
  requireAuth,
  rateLimit({ name: "bookings.cancel", max: 30, windowSec: 60 }),
  validate({ params: bookingIdParamSchema }),
  cancelBooking
);

export default router;
