import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Category } from "@fixitnow/types";

import AdminCategoriesPage from "./page";

// --- Mocks --------------------------------------------------------------
const { apiMocks, ApiErrorMock, toastMock } = vi.hoisted(() => {
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
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    ApiErrorMock,
    toastMock: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock("@/lib/apiClient", () => ({
  ApiError: ApiErrorMock,
  api: {
    categories: {
      list: apiMocks.list,
      create: apiMocks.create,
      update: apiMocks.update,
      remove: apiMocks.remove,
    },
  },
}));

vi.mock("sonner", () => ({ toast: toastMock }));

// --- Fixtures -----------------------------------------------------------
const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "c-1",
  name: "Cleaning",
  slug: "cleaning",
  iconUrl: "https://cdn.example.com/clean.png",
  createdAt: new Date(2026, 4, 10).toISOString(),
  updatedAt: new Date(2026, 4, 10).toISOString(),
  ...overrides,
});

beforeEach(() => {
  apiMocks.list.mockReset();
  apiMocks.create.mockReset();
  apiMocks.update.mockReset();
  apiMocks.remove.mockReset();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("<AdminCategoriesPage />", () => {
  it("renders the existing categories, sorted alphabetically", async () => {
    apiMocks.list.mockResolvedValue({
      items: [
        makeCategory({ id: "p", name: "Plumbing", slug: "plumbing" }),
        makeCategory({ id: "c", name: "Cleaning", slug: "cleaning" }),
      ],
      page: 1,
      limit: 20,
      total: 2,
    });

    render(<AdminCategoriesPage />);

    const rows = await screen.findAllByTestId(/category-row-/);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Cleaning")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Plumbing")).toBeInTheDocument();
  });

  it("creates a new category via the form", async () => {
    apiMocks.list.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });
    const created = makeCategory({
      id: "new",
      name: "Painting",
      slug: "painting",
      iconUrl: "https://cdn.example.com/paint.png",
    });
    apiMocks.create.mockResolvedValue(created);

    render(<AdminCategoriesPage />);
    await screen.findByText(/no categories yet/i);

    const user = userEvent.setup();
    const createForm = screen.getByRole("form", { name: /create category/i });

    await user.type(within(createForm).getByLabelText(/name/i), "Painting");
    await user.type(
      within(createForm).getByLabelText(/icon url/i),
      "https://cdn.example.com/paint.png"
    );
    await user.click(
      within(createForm).getByRole("button", { name: /create/i })
    );

    await waitFor(() => {
      expect(apiMocks.create).toHaveBeenCalledWith({
        name: "Painting",
        iconUrl: "https://cdn.example.com/paint.png",
      });
    });

    expect(await screen.findByText("Painting")).toBeInTheDocument();
    expect(toastMock.success).toHaveBeenCalledWith('Created "Painting"');
  });

  it("opens the edit Sheet and patches the row", async () => {
    const existing = makeCategory({ name: "Cleaning", slug: "cleaning" });
    apiMocks.list.mockResolvedValue({
      items: [existing],
      page: 1,
      limit: 20,
      total: 1,
    });
    apiMocks.update.mockResolvedValue({
      ...existing,
      name: "Deep Cleaning",
    });

    render(<AdminCategoriesPage />);
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: /edit cleaning/i })
    );
    const sheet = await screen.findByRole("form", { name: /edit category/i });

    const nameInput = within(sheet).getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Deep Cleaning");

    await user.click(
      within(sheet).getByRole("button", { name: /save changes/i })
    );

    await waitFor(() => {
      expect(apiMocks.update).toHaveBeenCalledWith("c-1", {
        name: "Deep Cleaning",
        iconUrl: existing.iconUrl,
      });
    });

    expect(await screen.findByText("Deep Cleaning")).toBeInTheDocument();
  });

  it("requires a two-click confirmation before delete", async () => {
    const existing = makeCategory();
    apiMocks.list.mockResolvedValue({
      items: [existing],
      page: 1,
      limit: 20,
      total: 1,
    });
    apiMocks.remove.mockResolvedValue(undefined);

    render(<AdminCategoriesPage />);
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: /^delete cleaning$/i })
    );

    // No API call yet — only after the explicit confirm.
    expect(apiMocks.remove).not.toHaveBeenCalled();

    const confirmBtn = await screen.findByRole("button", {
      name: /confirm delete cleaning/i,
    });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(apiMocks.remove).toHaveBeenCalledWith("c-1");
    });
    await waitFor(() => {
      expect(screen.queryByText("Cleaning")).not.toBeInTheDocument();
    });
    expect(toastMock.success).toHaveBeenCalledWith("Category deleted");
  });

  it("surfaces a 409 'still in use' with a friendly toast", async () => {
    const existing = makeCategory();
    apiMocks.list.mockResolvedValue({
      items: [existing],
      page: 1,
      limit: 20,
      total: 1,
    });
    apiMocks.remove.mockRejectedValue(
      new ApiErrorMock(409, "CONFLICT", "in use")
    );

    render(<AdminCategoriesPage />);
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: /^delete cleaning$/i })
    );
    await user.click(
      await screen.findByRole("button", { name: /confirm delete cleaning/i })
    );

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringMatching(/still used by one or more businesses/i)
      );
    });
    // Row stays — refusal is non-destructive.
    expect(screen.getByText("Cleaning")).toBeInTheDocument();
  });
});
