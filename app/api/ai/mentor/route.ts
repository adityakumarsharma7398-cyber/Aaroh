import { getMentorResponse } from "@/lib/ai/mentor";
import { mentorRequestSchema } from "@/lib/ai/schemas";

const MAX_BODY_CHARS = 20_000;

export async function POST(request: Request) {
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
