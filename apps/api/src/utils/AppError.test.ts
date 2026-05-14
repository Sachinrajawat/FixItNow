import { AppError } from "./AppError";

describe("AppError factories", () => {
  it("badRequest -> 400 BAD_REQUEST", () => {
    const e = AppError.badRequest("nope");
    expect(e.status).toBe(400);
    expect(e.code).toBe("BAD_REQUEST");
    expect(e.message).toBe("nope");
    expect(e).toBeInstanceOf(Error);
  });

  it("notFound formats the resource name", () => {
    expect(AppError.notFound("User").message).toBe("User not found");
  });

  it("internal hides the message from clients (expose=false)", () => {
    expect(AppError.internal().expose).toBe(false);
  });

  it("forbidden / unauthorized / conflict / tooMany return correct codes", () => {
    expect(AppError.forbidden().code).toBe("FORBIDDEN");
    expect(AppError.unauthorized().code).toBe("UNAUTHORIZED");
    expect(AppError.conflict("dup").code).toBe("CONFLICT");
    expect(AppError.tooMany().code).toBe("TOO_MANY_REQUESTS");
  });
});
