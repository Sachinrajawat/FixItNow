import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import Hero from "./Hero";

describe("<Hero />", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("does not navigate on empty submit", async () => {
    const user = userEvent.setup();
    render(<Hero />);

    await user.click(screen.getByRole("button", { name: /search services/i }));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to /search/<encoded query> on submit", async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const input = screen.getByRole("searchbox", { name: /search/i });
    await user.type(input, "AC repair{Enter}");

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/search/AC%20repair");
  });

  it("trims whitespace before navigating", async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const input = screen.getByRole("searchbox", { name: /search/i });
    await user.type(input, "   plumbing   {Enter}");

    expect(pushMock).toHaveBeenCalledWith("/search/plumbing");
  });
});
