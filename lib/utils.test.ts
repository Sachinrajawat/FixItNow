import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  it("merges plain class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("dedupes conflicting Tailwind utilities (last one wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports object & array forms via clsx", () => {
    expect(cn(["a", { b: true, c: false }])).toBe("a b");
  });
});
