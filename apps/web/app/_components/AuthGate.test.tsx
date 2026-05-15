import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { AuthGate } from "./AuthGate";

const { authMock, routerMock } = vi.hoisted(() => ({
  authMock: {
    status: "unauthenticated" as
      | "loading"
      | "authenticated"
      | "unauthenticated",
  },
  routerMock: { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/mybooking",
}));

beforeEach(() => {
  authMock.status = "unauthenticated";
  routerMock.replace.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("<AuthGate />", () => {
  it("shows a spinner while auth is loading", () => {
    authMock.status = "loading";
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    );
    expect(screen.getByRole("status")).toHaveTextContent(/checking session/i);
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login with next=<current path>", async () => {
    authMock.status = "unauthenticated";
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    );
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith(
        "/login?next=%2Fmybooking"
      );
    });
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    authMock.status = "authenticated";
    render(
      <AuthGate>
        <p>private dashboard</p>
      </AuthGate>
    );
    expect(screen.getByText("private dashboard")).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
