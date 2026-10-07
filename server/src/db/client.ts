import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "node:path";
import * as schema from "./schema";

const rawDbPath = process.env.DATABASE_URL || process.env.DATABASE_PATH || path.resolve(process.cwd(), "data.db");
const dbUrl = rawDbPath.startsWith("file:") || rawDbPath.startsWith("libsql:") || rawDbPath.startsWith("http:") || rawDbPath.startsWith("https:") ? rawDbPath : `file:${rawDbPath}`;

// Isolated database client connection
export const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Isolated Drizzle ORM instance
export const db = drizzle(client, { schema });

/**
 * Initializes database check and verifies connectivity.
 * Isolates the SQLite connection so the underlying DB can be swapped easily.
 */
export async function checkDatabaseConnection(): Promise<{ ok: boolean; dialect: string; path: string }> {
  try {
    // Ensure foreign key constraints are strictly enforced in SQLite
    await client.execute("PRAGMA foreign_keys = ON;");
    const result = await client.execute("SELECT 1 AS ready");
    const isReady = result.rows.length > 0;
    return {
      ok: isReady,
      dialect: "sqlite (libsql)",
      path: dbUrl,
    };
  } catch (error) {
    console.error("Database connection check failed:", error);
    return {
      ok: false,
      dialect: "sqlite (libsql)",
      path: dbUrl,
    };
  }
}
