import { getMentorResponse } from "@/lib/ai/mentor";
import { mentorRequestSchema } from "@/lib/ai/schemas";

/**
 * TEMPORARY / TESTING ROUTE: trusts the client-supplied `hintLevel`.
 * Final production flow must authenticate the student and determine the
 * allowed hint level server-side (via requestHint() in lib/ai/integration.ts)
 * before calling mentor generation. This route remains temporarily compatible
 * for Phase 1 testing until the auth/data layer exists. Do not expose it to
 * students as-is.
 *
 * Disabled when NODE_ENV is "production" unless AI_ALLOW_UNTRUSTED_MENTOR=true,
 * so a deployed build cannot let a client pick its own hint level by accident.
 */
const MAX_BODY_CHARS = 20_000;

export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AI_ALLOW_UNTRUSTED_MENTOR !== "true"
  ) {
    return Response.json(
      { success: false, error: "This endpoint is disabled in production." },
      { status: 403 },
    );
  }

  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_CHARS) {
    return Response.json(
      { success: false, error: "Request too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = mentorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid request.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const data = await getMentorResponse(parsed.data);
  return Response.json({ success: true, data });
}
