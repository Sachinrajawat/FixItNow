import request from "supertest";
import type { Express } from "express";
import { User } from "../../src/models/User";
import { signAccessToken } from "../../src/services/tokens";
import type { UserRole } from "@fixitnow/types";

export interface SeededUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessToken: string;
}

/**
 * Create a user directly through the User model (skipping the /auth/signup
 * route, which would also pick a default role of "user") and sign an access
 * token for it. Useful for tests that need an admin/owner without juggling
 * a full signup flow.
 */
export async function makeUser(
  overrides: Partial<{
    email: string;
    name: string;
    password: string;
    role: UserRole;
  }> = {}
): Promise<SeededUser> {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random()}@test`;
  const password = overrides.password ?? "supersecret123";
  const name = overrides.name ?? "Test User";
  const role: UserRole = overrides.role ?? "user";

  const doc = await User.create({ name, email, password, role });
  const accessToken = signAccessToken(String(doc._id), role);
  return {
    id: String(doc._id),
    email,
    name,
    role,
    accessToken,
  };
}

/** Sign-up via the public route, returning the access token + cookie. */
export async function signupViaApi(
  app: Express,
  body: { name?: string; email?: string; password?: string } = {}
) {
  const payload = {
    name: body.name ?? "Test User",
    email: body.email ?? `user-${Date.now()}-${Math.random()}@test.com`,
    password: body.password ?? "supersecret123",
  };
  const res = await request(app).post("/auth/signup").send(payload);
  if (res.status !== 201) {
    throw new Error(
      `signupViaApi failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }
  return {
    user: res.body.user as { id: string; email: string; name: string },
    accessToken: res.body.accessToken as string,
    cookie: res.headers["set-cookie"] as unknown as string[],
  };
}
