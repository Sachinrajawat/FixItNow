import { openApiSpec } from "../src/openapi";

describe("OpenAPI spec", () => {
  it("compiles successfully from the shared Zod schemas", () => {
    expect(openApiSpec.openapi).toBe("3.0.3");
    expect(openApiSpec.info.title).toBe("FixItNow API");
  });

  it("contains every route the API actually serves", () => {
    const paths = Object.keys(openApiSpec.paths ?? {}).sort();
    expect(paths).toEqual(
      [
        "/healthz",
        "/readyz",
        "/auth/signup",
        "/auth/login",
        "/auth/refresh",
        "/auth/logout",
        "/auth/me",
        "/categories",
        "/categories/{id}",
        "/businesses",
        "/businesses/{id}",
        "/bookings",
        "/bookings/mine",
        "/bookings/slots",
        "/bookings/{id}/cancel",
        "/reviews",
        "/reviews/{id}",
      ].sort()
    );
  });

  it("exposes the shared component schemas under #/components/schemas", () => {
    const schemas = openApiSpec.components?.schemas ?? {};
    for (const name of [
      "ApiError",
      "User",
      "AuthResponse",
      "Category",
      "Business",
      "Booking",
      "Review",
    ]) {
      expect(schemas).toHaveProperty(name);
    }
  });

  it("declares bearerAuth security on protected endpoints", () => {
    const meGet = openApiSpec.paths?.["/auth/me"]?.get;
    expect(meGet?.security).toEqual([{ bearerAuth: [] }]);
  });
});
