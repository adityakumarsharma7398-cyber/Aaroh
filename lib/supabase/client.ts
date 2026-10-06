import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components (browser).
 *
 * Use this in any "use client" component that needs to interact with Supabase.
 * The browser client handles cookie storage automatically.
 *
 * Phase 0 — Foundation plumbing only.
 * Authentication UI, roles, and business logic are implemented in later phases.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
