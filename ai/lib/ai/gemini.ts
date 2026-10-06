import { GoogleGenAI } from "@google/genai";

if (typeof window !== "undefined") {
  throw new Error("lib/ai/gemini.ts is server-only.");
}

/** Single place to change the model. Override with GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const TIMEOUT_MS = 15_000;

export type GeminiFailure =
  | "missing_api_key"
  | "rate_limited"
  | "timeout"
  | "api_error";

export class GeminiError extends Error {
  readonly code: GeminiFailure;
  constructor(code: GeminiFailure) {
    super(code);
    this.code = code;
  }
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

/** One Gemini generation. Returns raw text; callers must validate it. */
export async function generateJson(
  systemInstruction: string,
  prompt: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiError("missing_api_key");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const result = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 1500,
        temperature: 0.6,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });
    return result.text ?? "";
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const name = (err as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError")
      throw new GeminiError("timeout");
    if (status === 429) throw new GeminiError("rate_limited");
    throw new GeminiError("api_error");
  }
}
