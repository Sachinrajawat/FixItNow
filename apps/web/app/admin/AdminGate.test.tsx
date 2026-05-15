import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { User } from "@fixitnow/types";

import { AdminGate } from "./AdminGate";

const { authMock, routerMock, toastMock } = vi.hoisted(() => ({
  authMock: {
    status: "unauthenticated" as
      | "loading"
      | "authenticated"
      | "unauthenticated",
    user: null as User | null,
  },
  routerMock: { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() },
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/admin",
}));

vi.mock("sonner", () => ({ toast: toastMock }));

const makeUser = (role: User["role"]): User => ({
  id: "u-1",
  name: "Test",
  email: "t@e.com",
  image: null,
  role,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

beforeEach(() => {
  authMock.status = "unauthenticated";
  authMock.user = null;
  routerMock.replace.mockReset();
  toastMock.error.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("<AdminGate />", () => {
  it("shows a spinner while auth is loading", () => {
    authMock.status = "loading";
    render(
      <AdminGate>
        <p>secret</p>
      </AdminGate>
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /checking permissions/i
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login with a next= hint", async () => {
    authMock.status = "unauthenticated";
    authMock.user = null;
    render(
      <AdminGate>
        <p>secret</p>
      </AdminGate>
    );
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/login?next=%2Fadmin");
    });
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("redirects authenticated non-admins to / with an error toast", async () => {
    authMock.status = "authenticated";
    authMock.user = makeUser("user");
    render(
      <AdminGate>
        <p>secret</p>
      </AdminGate>
    );
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/");
    });
    expect(toastMock.error).toHaveBeenCalledWith("Admin access required.");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders the children for admins", () => {
    authMock.status = "authenticated";
    authMock.user = makeUser("admin");
    render(
      <AdminGate>
        <p>secret dashboard</p>
      </AdminGate>
    );
    expect(screen.getByText("secret dashboard")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
