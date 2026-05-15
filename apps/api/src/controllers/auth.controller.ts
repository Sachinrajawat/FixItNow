import type { Request, Response, NextFunction } from "express";
import {
  signupBodySchema,
  loginBodySchema,
  type AuthResponse,
} from "@fixitnow/types";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import {
  signAccessToken,
  issueRefreshToken,
  verifyAndConsumeRefreshToken,
  revokeAllUserRefreshTokens,
} from "../services/tokens";
import { env } from "../config/env";

const REFRESH_COOKIE = "fin_rt";

function setRefreshCookie(res: Response, token: string) {
  // In production the web (Vercel) and the API (Render) live on different
  // sites. A SameSite=Lax cookie can be SET on a cross-site response but
  // is NOT sent on cross-site subresource fetches — so a new tab calling
  // POST /auth/refresh from the browser would silently fail and log the
  // user out. SameSite=None unblocks cross-site send, and the browser
  // requires it to be paired with Secure (HTTPS-only).
  //
  // Local dev stays on Lax because (a) we don't ship HTTPS on localhost
  // so Secure would prevent the cookie being set at all, and (b)
  // localhost:3000 ↔ localhost:4000 count as same-site so Lax already
  // permits the cross-port fetch.
  const isProd = env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  const isProd = env.NODE_ENV === "production";
  res.clearCookie(REFRESH_COOKIE, {
    path: "/auth",
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
}

function userToJson(doc: InstanceType<typeof User>): AuthResponse["user"] {
  const json = doc.toJSON() as Record<string, unknown>;
  const toIso = (v: unknown): string => {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
    return new Date().toISOString();
  };
  return {
    id: String(json.id),
    name: String(json.name),
    email: String(json.email),
    image: (json.image as string | null | undefined) ?? null,
    role: json.role as AuthResponse["user"]["role"],
    createdAt: toIso(json.createdAt),
    updatedAt: toIso(json.updatedAt),
  };
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const body = signupBodySchema.parse(req.body);

    const exists = await User.findOne({ email: body.email }).lean();
    if (exists) throw AppError.conflict("Email is already registered");

    const user = await User.create(body);

    const accessToken = signAccessToken(user.id, user.role);
    const { token: refreshToken } = await issueRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    const response: AuthResponse = {
      user: userToJson(user),
      accessToken,
    };
    res.status(201).json(response);
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginBodySchema.parse(req.body);

    // password is select:false, so explicitly select it.
    const user = await User.findOne({ email: body.email }).select("+password");
    if (!user) throw AppError.unauthorized("Invalid email or password");

    const ok = await user.comparePassword(body.password);
    if (!ok) throw AppError.unauthorized("Invalid email or password");

    const accessToken = signAccessToken(user.id, user.role);
    const { token: refreshToken } = await issueRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    const response: AuthResponse = {
      user: userToJson(user),
      accessToken,
    };
    res.json(response);
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw AppError.unauthorized("Missing refresh token");

    const { userId } = await verifyAndConsumeRefreshToken(token);

    const user = await User.findById(userId).lean();
    if (!user) throw AppError.unauthorized("User no longer exists");

    const accessToken = signAccessToken(String(user._id), user.role);
    const { token: newRefresh } = await issueRefreshToken(String(user._id));
    setRefreshCookie(res, newRefresh);

    res.json({ accessToken });
  } catch (e) {
    if (e instanceof Error && /revoked|already used|jwt/i.test(e.message)) {
      next(AppError.unauthorized("Refresh token is invalid"));
      return;
    }
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.auth?.userId) {
      await revokeAllUserRefreshTokens(req.auth.userId);
    }
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const user = await User.findById(req.auth.userId);
    if (!user) throw AppError.notFound("User");
    res.json({ user: userToJson(user) });
  } catch (e) {
    next(e);
  }
}
