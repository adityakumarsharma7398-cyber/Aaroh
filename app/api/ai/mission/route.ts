import { handleMissionRequest } from "../../../../lib/ai/mission.ts";

const MAX_BODY_CHARS = 10_000;

const invalid = (status = 400) =>
  Response.json(
    { success: false, error: "Invalid mission request" },
    { status },
  );

export async function POST(request: Request) {
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_CHARS) return invalid(413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return invalid();
  }

  const result = await handleMissionRequest(body);
  return Response.json(result.body, { status: result.status });
}
