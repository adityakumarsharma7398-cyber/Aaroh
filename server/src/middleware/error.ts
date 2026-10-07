import { Request, Response, NextFunction } from "express";

/**
 * Standard API error class carrying HTTP status code and error code.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Centralized Express error handler ensuring all error responses
 * strictly follow the project's contract:
 * {
 *   "error": {
 *     "code": "...",
 *     "message": "..."
 *   }
 * }
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : "An unexpected server error occurred";

  // Prevent exposing sensitive stack traces or database errors in production
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : message,
    },
  });
}
