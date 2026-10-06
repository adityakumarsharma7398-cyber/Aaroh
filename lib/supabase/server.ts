import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * Must be called as an async function because Next.js cookies() is async
 * in App Router.
 *
 * The setAll try/catch is intentional: Server Components cannot write cookies.
 * Session refresh is handled by proxy.ts instead.
 *
 * Phase 0 — Foundation plumbing only.
 * Authentication UI, roles, and business logic are implemented in later phases.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — session refresh is handled
            // by proxy.ts. This catch is safe to ignore.
          }
        },
      },
    }
  );
}
