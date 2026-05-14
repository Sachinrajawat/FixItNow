import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../services/tokens";
import type { UserRole } from "@fixitnow/types";

export interface AuthContext {
  userId: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Validates the Bearer token, attaches { userId, role } to req.auth.
 * Throws 401 if anything is wrong.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing Bearer token"));
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) return next(AppError.unauthorized("Missing Bearer token"));

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(AppError.unauthorized("Access token expired"));
    }
    if (err instanceof JsonWebTokenError) {
      return next(AppError.unauthorized("Invalid access token"));
    }
    next(err);
  }
}

/**
 * RBAC gate. Use after requireAuth.
 *   router.delete("/x", requireAuth, requireRole("admin"), handler)
 */
export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!allowed.includes(req.auth.role)) {
      return next(AppError.forbidden(`Requires role: ${allowed.join(", ")}`));
    }
    next();
  };
}
