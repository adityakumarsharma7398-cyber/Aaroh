import { generateJson } from "./gemini.ts";
import { MISSION_FALLBACKS } from "./fallbacks.ts";
import { buildMissionPrompt, MISSION_SYSTEM_INSTRUCTION } from "./prompts.ts";
import {
  missionRequestSchema,
  missionSchema,
  type Mission,
  type MissionRequest,
  type MissionResponse,
} from "./schemas.ts";

/** Language a mission must never contain: scoring, labelling, surveillance, invented attribution. */
const FORBIDDEN: RegExp[] = [
  /\b(character|personality|attention|concentration|focus)\s+(score|scoring|rating|percentage|level|test|assessment)\b/i,
  /\byou are (a |an )?(self-reliant|persistent|resilient|disciplined|determined|good|bad)\b/i,
  /\bhow (self-reliant|persistent|resilient|disciplined|determined|focused)\b/i,
  /\brate (yourself|your (character|focus|effort))\b/i,
  /\b(good|bad) (student|person)\b/i,
  /\bprove (that )?you\b/i,
  /\b(webcam|camera|eye[- ]?contact|eye[- ]?tracking)\b/i,
  /vivekananda/i,
];

export function violatesMissionSafety(m: Mission): boolean {
  const text = [
    m.title,
    m.challenge,
    m.focus,
    ...m.instructions,
    m.reflection ?? "",
  ].join("\n");
  return FORBIDDEN.some((re) => re.test(text));
}

export function getFallbackMission(req: MissionRequest): MissionResponse {
  return {
    success: true,
    mission: MISSION_FALLBACKS[req.developmentDimension],
    source: "fallback",
  };
}

/** Never throws: any Gemini/validation failure yields the deterministic fallback. */
export async function generateMission(
  req: MissionRequest,
  generate: typeof generateJson = generateJson,
): Promise<MissionResponse> {
  try {
    const raw = await generate(
      MISSION_SYSTEM_INSTRUCTION,
      buildMissionPrompt(req),
    );
    const mission = missionSchema.parse(JSON.parse(raw));
    if (violatesMissionSafety(mission)) throw new Error("unsafe_mission");
    return { success: true, mission, source: "gemini" };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "missing_api_key") {
      console.error(`[mission] falling back: ${code ?? (err as Error).name}`);
    }
    return getFallbackMission(req);
  }
}

/** Request handling shared by the route and tests. */
export async function handleMissionRequest(
  body: unknown,
  generate: typeof generateJson = generateJson,
): Promise<{ status: number; body: object }> {
  const parsed = missionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: { success: false, error: "Invalid mission request" },
    };
  }
  return { status: 200, body: await generateMission(parsed.data, generate) };
}
