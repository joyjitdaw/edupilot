const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: Msg[], opts?: { json?: boolean }): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError("The AI service is not configured yet.", 500);

  let res: Response;
  try {
    res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: MODEL,
        messages,
        ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
  } catch {
    throw new AiError("Could not reach the AI service. Please try again.", 503);
  }

  if (res.status === 429) throw new AiError("The AI tutor is busy right now. Please retry in a moment.", 429);
  if (res.status === 402) throw new AiError("AI credits have run out. Please top up to keep using AI features.", 402);
  if (!res.ok) throw new AiError("The AI service returned an error. Please try again.", res.status);

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AiError("The AI service returned an empty response.", 502);
  return content;
}

export async function chatJson<T>(messages: Msg[]): Promise<T> {
  const raw = await chat(messages, { json: true });
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AiError("The AI response could not be understood. Please try again.", 502);
  }
}
