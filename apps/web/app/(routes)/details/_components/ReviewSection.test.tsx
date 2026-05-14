import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Review, User } from "@fixitnow/types";

import { aggregateOf, ReviewSection } from "./ReviewSection";
import { pinCurrentUserFirst } from "./ReviewList";

// --- Mocks --------------------------------------------------------------
const { apiMocks, ApiErrorMock } = vi.hoisted(() => {
  class ApiErrorMock extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return {
    apiMocks: {
      listForBusiness: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    },
    ApiErrorMock,
  };
});

vi.mock("@/lib/apiClient", () => ({
  ApiError: ApiErrorMock,
  api: {
    reviews: {
      listForBusiness: apiMocks.listForBusiness,
      create: apiMocks.create,
      remove: apiMocks.remove,
    },
  },
}));

const authMock = vi.hoisted(() => ({
  status: "unauthenticated" as "loading" | "authenticated" | "unauthenticated",
  user: null as User | null,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authMock,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// --- Fixtures -----------------------------------------------------------
const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "u-me",
  name: "Me Userson",
  email: "me@example.com",
  image: null,
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: "r-1",
  businessId: "biz-1",
  userId: "u-other",
  userName: "Other Person",
  rating: 4,
  comment: "Very good",
  createdAt: new Date(2026, 4, 10).toISOString(),
  updatedAt: new Date(2026, 4, 10).toISOString(),
  ...overrides,
});

function listResponse(items: Review[]) {
  return { items, page: 1, limit: 20, total: items.length };
}

beforeEach(() => {
  apiMocks.listForBusiness.mockReset();
  apiMocks.create.mockReset();
  apiMocks.remove.mockReset();
  authMock.status = "unauthenticated";
  authMock.user = null;
});

afterEach(() => {
  vi.clearAllMocks();
});

// --- Pure-logic tests ---------------------------------------------------
describe("aggregateOf()", () => {
  it("returns zeroes for an empty list", () => {
    expect(aggregateOf([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
  });

  it("matches the server's 1-decimal rounding", () => {
    expect(
      aggregateOf([makeReview({ rating: 5 }), makeReview({ rating: 3 })])
    ).toEqual({ ratingAvg: 4, ratingCount: 2 });
    expect(
      aggregateOf([
        makeReview({ rating: 5 }),
        makeReview({ rating: 4 }),
        makeReview({ rating: 4 }),
      ])
    ).toEqual({ ratingAvg: 4.3, ratingCount: 3 });
  });
});

describe("pinCurrentUserFirst()", () => {
  it("is a no-op when no current user", () => {
    const list = [makeReview({ id: "a" }), makeReview({ id: "b" })];
    expect(pinCurrentUserFirst(list)).toBe(list);
  });

  it("hoists the user's own review to the top, preserving the rest", () => {
    const mine = makeReview({ id: "mine", userId: "u-me" });
    const other1 = makeReview({ id: "o1", userId: "u-1" });
    const other2 = makeReview({ id: "o2", userId: "u-2" });
    const out = pinCurrentUserFirst([other1, mine, other2], "u-me");
    expect(out.map((r) => r.id)).toEqual(["mine", "o1", "o2"]);
  });
});

// --- Rendering / interaction -------------------------------------------
function renderSection({
  reviews = [] as Review[],
  ratingAvg = 0,
  ratingCount = 0,
} = {}) {
  apiMocks.listForBusiness.mockResolvedValue(listResponse(reviews));
  const onAggregateChange = vi.fn();
  const utils = render(
    <ReviewSection
      businessId="biz-1"
      aggregate={{ ratingAvg, ratingCount }}
      onAggregateChange={onAggregateChange}
    />
  );
  return { onAggregateChange, ...utils };
}

describe("<ReviewSection /> — unauthenticated", () => {
  it("shows a login link and no review form", async () => {
    renderSection();
    expect(
      await screen.findByText(/log in/i, { selector: "a" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /leave a review/i })
    ).not.toBeInTheDocument();
  });
});

describe("<ReviewSection /> — authenticated, no review yet", () => {
  beforeEach(() => {
    authMock.status = "authenticated";
    authMock.user = makeUser();
  });

  it("renders the form and posts a review on submit", async () => {
    const newReview = makeReview({
      id: "r-new",
      userId: "u-me",
      userName: "Me Userson",
      rating: 5,
      comment: "Loved it",
    });
    apiMocks.create.mockResolvedValue(newReview);

    const { onAggregateChange } = renderSection({ reviews: [] });

    // Wait for the form to render after the GET resolves.
    const form = await screen.findByRole("form", { name: /leave a review/i });
    const user = userEvent.setup();

    // Pick 5 stars.
    const fiveStar = within(form).getByRole("radio", { name: /5 stars/i });
    await user.click(fiveStar);

    // Write a comment.
    await user.type(within(form).getByLabelText(/comment/i), "Loved it");

    await user.click(
      within(form).getByRole("button", { name: /post review/i })
    );

    await waitFor(() => {
      expect(apiMocks.create).toHaveBeenCalledWith({
        businessId: "biz-1",
        rating: 5,
        comment: "Loved it",
      });
    });

    // Optimistic aggregate update (1 review, rating 5)
    expect(onAggregateChange).toHaveBeenLastCalledWith({
      ratingAvg: 5,
      ratingCount: 1,
    });

    // The new review now appears in the list, pinned with a "You" badge.
    expect(await screen.findByText("Loved it")).toBeInTheDocument();
    expect(screen.getByText(/^you$/i)).toBeInTheDocument();
  });

  it("surfaces a 409 from the API as 'already reviewed'", async () => {
    apiMocks.create.mockRejectedValue(
      new ApiErrorMock(409, "CONFLICT", "Already reviewed")
    );

    renderSection();
    const form = await screen.findByRole("form", { name: /leave a review/i });
    const user = userEvent.setup();

    await user.click(within(form).getByRole("radio", { name: /4 stars/i }));
    await user.click(
      within(form).getByRole("button", { name: /post review/i })
    );

    expect(
      await screen.findByText(/you've already reviewed this business/i)
    ).toBeInTheDocument();
  });

  it("blocks submission with no rating picked (Zod resolver)", async () => {
    renderSection();
    const form = await screen.findByRole("form", { name: /leave a review/i });
    const user = userEvent.setup();
    await user.click(
      within(form).getByRole("button", { name: /post review/i })
    );

    expect(apiMocks.create).not.toHaveBeenCalled();
  });
});

describe("<ReviewSection /> — authenticated, already reviewed", () => {
  beforeEach(() => {
    authMock.status = "authenticated";
    authMock.user = makeUser();
  });

  it("hides the form and shows a 'thanks' line", async () => {
    renderSection({
      reviews: [
        makeReview({
          id: "r-mine",
          userId: "u-me",
          userName: "Me Userson",
          rating: 5,
        }),
      ],
      ratingAvg: 5,
      ratingCount: 1,
    });

    expect(
      await screen.findByText(/you've already reviewed this business/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /leave a review/i })
    ).not.toBeInTheDocument();
  });

  it("deletes the user's review and updates the aggregate", async () => {
    apiMocks.remove.mockResolvedValue(undefined);
    const myReview = makeReview({
      id: "r-mine",
      userId: "u-me",
      userName: "Me Userson",
      rating: 5,
    });
    const otherReview = makeReview({
      id: "r-other",
      userId: "u-other",
      userName: "Someone Else",
      rating: 3,
    });

    const { onAggregateChange } = renderSection({
      reviews: [myReview, otherReview],
      ratingAvg: 4,
      ratingCount: 2,
    });

    const user = userEvent.setup();
    const deleteButton = await screen.findByRole("button", {
      name: /delete your review/i,
    });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(apiMocks.remove).toHaveBeenCalledWith("r-mine");
    });
    expect(onAggregateChange).toHaveBeenLastCalledWith({
      ratingAvg: 3,
      ratingCount: 1,
    });
    expect(
      screen.queryByRole("button", { name: /delete your review/i })
    ).not.toBeInTheDocument();
  });
});

describe("<ReviewSection /> — error path", () => {
  it("renders an error message when the initial fetch fails", async () => {
    authMock.status = "authenticated";
    authMock.user = makeUser();
    apiMocks.listForBusiness.mockRejectedValue(
      new ApiErrorMock(500, "INTERNAL", "boom")
    );
    render(
      <ReviewSection
        businessId="biz-1"
        aggregate={{ ratingAvg: 0, ratingCount: 0 }}
        onAggregateChange={() => {}}
      />
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't load reviews/i
    );
  });
});
