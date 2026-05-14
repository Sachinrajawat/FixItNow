import jwt, { type SignOptions } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";
import { getRedis } from "../config/redis";
import type { UserRole } from "@fixitnow/types";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

const REFRESH_PREFIX = "refresh:";

export function signAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Issue a new refresh token and store its jti in a Redis allowlist with the
 * matching TTL. This makes refresh tokens revocable: removing the key from
 * Redis invalidates the token.
 */
export async function issueRefreshToken(userId: string): Promise<{
  token: string;
  jti: string;
}> {
  const jti = uuid();
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"],
  });

  const ttlSeconds = ttlToSeconds(env.JWT_REFRESH_TTL);
  await getRedis().setex(`${REFRESH_PREFIX}${userId}:${jti}`, ttlSeconds, "1");

  return { token, jti };
}

export async function verifyAndConsumeRefreshToken(
  token: string
): Promise<{ userId: string; jti: string }> {
  const payload = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  ) as RefreshTokenPayload;

  const key = `${REFRESH_PREFIX}${payload.sub}:${payload.jti}`;
  // Atomic check-and-delete (token rotation: each refresh can be used once).
  const removed = await getRedis().del(key);
  if (removed === 0) {
    throw new Error("Refresh token has been revoked or already used");
  }

  return { userId: payload.sub, jti: payload.jti };
}

export async function revokeAllUserRefreshTokens(userId: string) {
  const r = getRedis();
  const stream = r.scanStream({
    match: `${REFRESH_PREFIX}${userId}:*`,
    count: 100,
  });
  return new Promise<void>((resolve, reject) => {
    const pipeline = r.pipeline();
    stream.on("data", (keys: string[]) => {
      for (const k of keys) pipeline.del(k);
    });
    stream.on("end", async () => {
      await pipeline.exec();
      resolve();
    });
    stream.on("error", reject);
  });
}

/** Convert "15m" / "7d" / "1h" to seconds. */
function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)\s*([smhdw])$/.exec(ttl.trim());
  if (!match) return Number(ttl) || 0;
  const n = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };
  return n * (multipliers[unit] ?? 0);
}
