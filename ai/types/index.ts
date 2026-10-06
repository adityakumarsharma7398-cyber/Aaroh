/**
 * Shared TypeScript type definitions — Man-Making Engine
 *
 * Phase 0 placeholder.
 *
 * IMPORTANT OWNERSHIP RULES:
 * ──────────────────────────────────────────────────────────────────────────
 * Member 3 owns the database/domain types (tables, events, evidence, signals).
 * Member 1 owns AI-related types (Claude responses, hints, mentor outputs).
 * Member 2 owns UI-specific prop types.
 *
 * Do NOT define business-domain types here without coordination.
 * This file will be expanded in Phase 1 (AI Infrastructure) and beyond.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ─── Placeholder — expand in later phases ────────────────────────────────────

/**
 * Generic API response wrapper.
 * Used as a standard shape for Route Handler responses.
 */
export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
