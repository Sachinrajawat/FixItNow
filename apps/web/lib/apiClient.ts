/**
 * Typed `fetch` wrapper for the FixItNow API.
 *
 * Responsibilities:
 *   - Attaches the in-memory access token to every request.
 *   - On a 401 it transparently calls /auth/refresh once (using the HttpOnly
 *     `fin_rt` cookie set by the API), then retries the original call.
 *   - Supports caller-provided `AbortSignal`s so React effects can cancel
 *     in-flight requests when the consumer unmounts.
 *   - Surfaces a single typed `ApiError` so callers can branch on `status`
 *     / `code` without parsing strings.
 *
 * The access token is intentionally kept in memory — never localStorage —
 * which avoids XSS exfiltration. We persist auth across reloads through
 * the refresh cookie + a silent `/auth/refresh` on app boot.
 */
import { env } from "./env";
import type {
  ApiError as ApiErrorEnvelope,
  AuthResponse,
  User,
} from "@fixitnow/types";

const API_BASE = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

let accessToken: string | null = null;
type Subscriber = (token: string | null) => void;
const subscribers = new Set<Subscriber>();

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const cb of subscribers) cb(token);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function subscribeAccessToken(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Thrown by every helper below when the server returns a non-2xx response.
 *
 * Mirrors the standard ApiError envelope produced by `apps/api`.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }

  static fromEnvelope(status: number, body: unknown): ApiError {
    const envelope = body as ApiErrorEnvelope;
    if (envelope?.error?.code) {
      return new ApiError(
        status,
        envelope.error.code,
        envelope.error.message,
        envelope.error.requestId,
        envelope.error.details
      );
    }
    return new ApiError(status, `HTTP_${status}`, "Request failed");
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip the auto-refresh + retry logic (used by /auth/* calls). */
  skipAuthRefresh?: boolean;
  /** Skip the Bearer header even if a token is set. */
  skipAuthHeader?: boolean;
  signal?: AbortSignal;
  /** Replace the default credentials value (default: "include"). */
  credentials?: RequestCredentials;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Coordinates concurrent refresh attempts so a burst of 401s only triggers
 * a single /auth/refresh request.
 */
let inflightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const body = (await res.json()) as { accessToken: string };
      setAccessToken(body.accessToken);
      return body.accessToken;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const url = buildUrl(path, opts.query);
  const headers = new Headers();
  if (opts.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (!opts.skipAuthHeader && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method,
    headers,
    credentials: opts.credentials ?? "include",
    signal: opts.signal,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  };

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "Network request failed");
  }

  if (
    res.status === 401 &&
    !opts.skipAuthRefresh &&
    !path.startsWith("/auth/")
  ) {
    const next = await refreshAccessToken();
    if (next) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${next}`);
      res = await fetch(url, { ...init, headers: retryHeaders });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let body: unknown = undefined;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    throw ApiError.fromEnvelope(res.status, body);
  }

  return body as T;
}

/**
 * Public surface. Grouped by resource to mirror the route layout.
 */
import type {
  Business,
  BusinessListResponse,
  CreateBusinessBody,
  UpdateBusinessBody,
  Category,
  CategoryListResponse,
  CreateCategoryBody,
  Booking,
  BookingListResponse,
  BookingListMineQuery,
  BookedSlotsResponse,
  CreateBookingBody,
  CreateReviewBody,
  Review,
  ReviewListResponse,
} from "@fixitnow/types";

export interface BusinessSearchParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  near?: string;
  radius?: number;
  signal?: AbortSignal;
}

export const api = {
  auth: {
    async signup(input: {
      name: string;
      email: string;
      password: string;
    }): Promise<AuthResponse> {
      const res = await request<AuthResponse>("/auth/signup", {
        method: "POST",
        body: input,
        skipAuthRefresh: true,
        skipAuthHeader: true,
      });
      setAccessToken(res.accessToken);
      return res;
    },
    async login(input: {
      email: string;
      password: string;
    }): Promise<AuthResponse> {
      const res = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: input,
        skipAuthRefresh: true,
        skipAuthHeader: true,
      });
      setAccessToken(res.accessToken);
      return res;
    },
    async logout(): Promise<void> {
      try {
        await request<void>("/auth/logout", { method: "POST" });
      } finally {
        setAccessToken(null);
      }
    },
    async me(signal?: AbortSignal): Promise<User | null> {
      try {
        const res = await request<{ user: User }>("/auth/me", { signal });
        return res.user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    /**
     * Boot-time helper. Tries to use the refresh cookie to mint a new access
     * token without showing the user a login flow. Returns the populated
     * user on success, or null when there's no valid refresh cookie.
     */
    async bootstrap(): Promise<User | null> {
      const token = await refreshAccessToken();
      if (!token) return null;
      try {
        return await api.auth.me();
      } catch {
        return null;
      }
    },
  },

  categories: {
    list(signal?: AbortSignal): Promise<CategoryListResponse> {
      return request<CategoryListResponse>("/categories", { signal });
    },
    get(idOrSlug: string, signal?: AbortSignal): Promise<Category> {
      return request<Category>(`/categories/${encodeURIComponent(idOrSlug)}`, {
        signal,
      });
    },
    create(body: CreateCategoryBody): Promise<Category> {
      return request<Category>("/categories", {
        method: "POST",
        body,
      });
    },
  },

  businesses: {
    list(params: BusinessSearchParams = {}): Promise<BusinessListResponse> {
      const { signal, ...query } = params;
      return request<BusinessListResponse>("/businesses", {
        query,
        signal,
      });
    },
    get(idOrSlug: string, signal?: AbortSignal): Promise<Business> {
      return request<Business>(`/businesses/${encodeURIComponent(idOrSlug)}`, {
        signal,
      });
    },
    create(body: CreateBusinessBody): Promise<Business> {
      return request<Business>("/businesses", { method: "POST", body });
    },
    update(id: string, body: UpdateBusinessBody): Promise<Business> {
      return request<Business>(`/businesses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      });
    },
    remove(id: string): Promise<void> {
      return request<void>(`/businesses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },

  bookings: {
    create(body: CreateBookingBody): Promise<Booking> {
      return request<Booking>("/bookings", { method: "POST", body });
    },
    mine(
      query: BookingListMineQuery = { page: 1, limit: 20 },
      signal?: AbortSignal
    ): Promise<BookingListResponse> {
      return request<BookingListResponse>("/bookings/mine", {
        query,
        signal,
      });
    },
    slots(
      businessId: string,
      date: string,
      signal?: AbortSignal
    ): Promise<BookedSlotsResponse> {
      return request<BookedSlotsResponse>("/bookings/slots", {
        query: { businessId, date },
        signal,
      });
    },
    cancel(id: string): Promise<Booking> {
      return request<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, {
        method: "PATCH",
      });
    },
  },

  reviews: {
    listForBusiness(
      businessId: string,
      signal?: AbortSignal
    ): Promise<ReviewListResponse> {
      return request<ReviewListResponse>("/reviews", {
        query: { businessId },
        signal,
      });
    },
    create(body: CreateReviewBody): Promise<Review> {
      return request<Review>("/reviews", { method: "POST", body });
    },
    remove(id: string): Promise<void> {
      return request<void>(`/reviews/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },
};

export type ApiClient = typeof api;
