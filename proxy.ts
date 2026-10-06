import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session refresh middleware.
 *
 * Runs on every non-static request to keep the Supabase auth session alive.
 * IMPORTANT: Must call supabase.auth.getUser() â€” not getSession() â€” because
 * getUser() validates the token against the Supabase Auth server.
 *
 * Cookie propagation pattern (request â†’ response) is required to avoid
 * auth state race conditions in Server Components.
 *
 * Phase 0 â€” Auth plumbing only.
 * Route protection and role-based redirects are added in later phases.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet (no .env.local) — skip session refresh.
  if (!url || !anonKey) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Step 1: Propagate cookies onto the mutated request object
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: Create a fresh response with the updated request
          supabaseResponse = NextResponse.next({
            request,
          });
          // Step 3: Set cookies on the response so the browser receives them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session. getUser() validates the JWT against Supabase Auth.
  // This is intentionally not awaited in a way that blocks the response â€”
  // it just ensures the session cookie is kept fresh.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (favicon)
     * - image files   (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
