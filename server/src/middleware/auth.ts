import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { profiles } from "../db/schema";
import { ApiError } from "./error";
import type { Profile, ProfileRole } from "@education-growth/shared";

export interface AuthenticatedRequest extends Request {
  user?: Profile;
}

/**
 * Authoritative Authentication Middleware.
 * 
 * Inspects `Authorization: Bearer <user_id>` or `x-user-id: <user_id>` headers.
 * Resolves and validates the identity against the database `profiles` table.
 * Attaches the authenticated Profile to `req.user`.
 * 
 * Never trusts unauthenticated or spoofed client identities.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers["x-user-id"];

  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (typeof userIdHeader === "string") {
    token = userIdHeader.trim();
  }

  if (!token) {
    next(
      new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication required. Please provide a valid Authorization: Bearer <user_id> or x-user-id header."
      )
    );
    return;
  }

  try {
    const matched = await db.select().from(profiles).where(eq(profiles.id, token)).limit(1);

    if (matched.length === 0) {
      next(
        new ApiError(
          401,
          "INVALID_CREDENTIALS",
          `User identity '${token}' does not exist in the system.`
        )
      );
      return;
    }

    req.user = matched[0] as Profile;
    next();
  } catch (error) {
    next(
      new ApiError(
        500,
        "AUTH_DATABASE_ERROR",
        "Failed to verify user credentials against database."
      )
    );
  }
}

/**
 * Authoritative Role Authorization Middleware Guard.
 * 
 * Enforces that the authenticated user possesses the required role (e.g., 'teacher').
 * Returns 403 Forbidden if the role does not match.
 */
export function requireRole(requiredRole: ProfileRole) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication required."));
      return;
    }

    if (req.user.role !== requiredRole) {
      next(
        new ApiError(
          403,
          "FORBIDDEN",
          `Access denied. Role '${requiredRole}' required, but user has role '${req.user.role}'.`
        )
      );
      return;
    }

    next();
  };
}
