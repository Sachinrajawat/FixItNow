import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, getAccessToken, setAccessToken } from "./apiClient";

type FetchInput = string | URL | Request;

interface MockResponseInit {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

function makeResponse({
  status = 200,
  body,
  headers = {},
}: MockResponseInit = {}): Response {
  const text = body === undefined ? "" : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

interface FetchCall {
  url: string;
  init: RequestInit;
}

let calls: FetchCall[];
let fetchSpy: ReturnType<typeof vi.spyOn> | null = null;

function installFetch(
  handler: (call: FetchCall) => Response | Promise<Response>
) {
  calls = [];
  fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input: FetchInput, init: RequestInit = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const call: FetchCall = { url, init };
      calls.push(call);
      const result = await handler(call);
      return result;
    });
}

beforeEach(() => {
  setAccessToken(null);
});

afterEach(() => {
  fetchSpy?.mockRestore();
  fetchSpy = null;
  setAccessToken(null);
});

describe("ApiError.fromEnvelope", () => {
  it("parses the standard envelope into a typed error", () => {
    const err = ApiError.fromEnvelope(409, {
      error: {
        code: "CONFLICT",
        message: "Already exists",
        requestId: "abc-123",
        details: { hint: "be unique" },
      },
    });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.message).toBe("Already exists");
    expect(err.requestId).toBe("abc-123");
    expect(err.details).toEqual({ hint: "be unique" });
  });

  it("falls back to a synthetic code when the envelope is malformed", () => {
    const err = ApiError.fromEnvelope(500, "<html>oops</html>");
    expect(err.code).toBe("HTTP_500");
  });
});

describe("api.categories.list", () => {
  it("issues a GET to /categories and parses the body", async () => {
    installFetch(() =>
      makeResponse({
        status: 200,
        body: { items: [{ id: "1", name: "Cleaning" }] },
      })
    );

    const res = await api.categories.list();
    expect(res.items).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/categories$/);
    expect(calls[0].init.method).toBe("GET");
    // credentials default to "include" so the refresh cookie is sent
    expect(calls[0].init.credentials).toBe("include");
  });

  it("attaches the Bearer header when an access token is set", async () => {
    setAccessToken("my-jwt");
    installFetch(() => makeResponse({ status: 200, body: { items: [] } }));

    await api.categories.list();
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get("Authorization")).toBe("Bearer my-jwt");
  });

  it("throws an ApiError mapped from the response envelope", async () => {
    installFetch(() =>
      makeResponse({
        status: 500,
        body: {
          error: { code: "INTERNAL", message: "Boom", requestId: "r-1" },
        },
      })
    );
    await expect(api.categories.list()).rejects.toMatchObject({
      status: 500,
      code: "INTERNAL",
      message: "Boom",
      requestId: "r-1",
    });
  });

  it("propagates AbortSignal cancellations", async () => {
    const controller = new AbortController();
    installFetch(({ init }) => {
      // Reject like a real fetch would.
      if (init.signal?.aborted) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      return makeResponse({ status: 200, body: { items: [] } });
    });

    controller.abort();
    await expect(api.categories.list(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

describe("auto-refresh on 401", () => {
  it("calls /auth/refresh once and retries the original request", async () => {
    const responses: Response[] = [
      makeResponse({
        status: 401,
        body: { error: { code: "UNAUTHORIZED", message: "expired" } },
      }),
      makeResponse({ status: 200, body: { accessToken: "fresh-token" } }),
      makeResponse({
        status: 200,
        body: { items: [{ id: "1", name: "Cleaning" }] },
      }),
    ];
    installFetch(() => responses.shift()!);

    setAccessToken("stale-token");
    const res = await api.categories.list();
    expect(res.items).toHaveLength(1);

    expect(calls).toHaveLength(3);
    expect(calls[0].url).toMatch(/\/categories$/);
    expect(calls[1].url).toMatch(/\/auth\/refresh$/);
    expect(calls[2].url).toMatch(/\/categories$/);

    // The retried call carries the freshly minted token.
    const retryHeaders = new Headers(calls[2].init.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
    expect(getAccessToken()).toBe("fresh-token");
  });

  it("clears the token and bubbles the 401 when refresh itself fails", async () => {
    const responses: Response[] = [
      makeResponse({
        status: 401,
        body: { error: { code: "UNAUTHORIZED", message: "expired" } },
      }),
      makeResponse({
        status: 401,
        body: { error: { code: "UNAUTHORIZED", message: "no cookie" } },
      }),
    ];
    installFetch(() => responses.shift()!);

    setAccessToken("stale-token");
    await expect(api.categories.list()).rejects.toMatchObject({
      status: 401,
    });
    expect(getAccessToken()).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it("shares a single inflight refresh across concurrent 401s", async () => {
    let refreshCount = 0;
    installFetch(({ url, init }) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCount += 1;
        // Simulate a small delay so both callers queue on the same promise.
        return new Promise<Response>((resolve) =>
          setTimeout(
            () =>
              resolve(
                makeResponse({
                  status: 200,
                  body: { accessToken: "shared-token" },
                })
              ),
            10
          )
        );
      }
      if (url.endsWith("/categories")) {
        const auth = new Headers(init.headers).get("Authorization");
        // Initial calls carry the stale token; retried calls carry the fresh one.
        if (auth === "Bearer shared-token") {
          return makeResponse({ status: 200, body: { items: [] } });
        }
        return makeResponse({
          status: 401,
          body: { error: { code: "UNAUTHORIZED", message: "expired" } },
        });
      }
      return makeResponse({ status: 200, body: {} });
    });

    setAccessToken("stale-token");
    const [a, b] = await Promise.all([
      api.categories.list(),
      api.categories.list(),
    ]);
    expect(a.items).toEqual([]);
    expect(b.items).toEqual([]);
    expect(refreshCount).toBe(1);
  });

  it("does NOT auto-refresh on /auth/* routes", async () => {
    installFetch(() =>
      makeResponse({
        status: 401,
        body: { error: { code: "UNAUTHORIZED", message: "no" } },
      })
    );

    const user = await api.auth.me();
    expect(user).toBeNull();
    // Only one fetch — the 401 from /auth/me must not trigger a refresh loop.
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/auth\/me$/);
  });
});

describe("api.auth", () => {
  it("login stores the access token in memory", async () => {
    installFetch(() =>
      makeResponse({
        status: 200,
        body: {
          user: { id: "u1", email: "a@b.c", name: "A" },
          accessToken: "login-token",
        },
      })
    );
    await api.auth.login({ email: "a@b.c", password: "supersecret123" });
    expect(getAccessToken()).toBe("login-token");
  });

  it("logout clears the access token even when the API call fails", async () => {
    setAccessToken("some-token");
    installFetch(() =>
      makeResponse({
        status: 500,
        body: { error: { code: "INTERNAL", message: "boom" } },
      })
    );
    await expect(api.auth.logout()).rejects.toMatchObject({ status: 500 });
    expect(getAccessToken()).toBeNull();
  });

  it("bootstrap returns null when there is no valid refresh cookie", async () => {
    installFetch(() =>
      makeResponse({
        status: 401,
        body: { error: { code: "UNAUTHORIZED", message: "no cookie" } },
      })
    );
    const me = await api.auth.bootstrap();
    expect(me).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});

describe("query string encoding", () => {
  it("omits null/undefined/empty values and stringifies the rest", async () => {
    installFetch(() => makeResponse({ status: 200, body: { items: [] } }));
    await api.businesses.list({
      page: 1,
      limit: 20,
      category: "cleaning",
      q: undefined,
      near: "",
    });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("category")).toBe("cleaning");
    expect(url.searchParams.has("q")).toBe(false);
    expect(url.searchParams.has("near")).toBe(false);
  });
});
