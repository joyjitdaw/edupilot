const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

export class AiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

type Msg = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chat(
  messages: Msg[],
  opts?: { json?: boolean },
): Promise<string> {
  const key = process.env["GEMINI_API_KEY"];

  if (!key) {
    throw new AiError("The AI service is not configured yet.", 500);
  }

  const systemMessages = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  let res: Response;

  try {
    res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        ...(systemMessages
          ? {
              systemInstruction: {
                parts: [{ text: systemMessages }],
              },
            }
          : {}),
        contents,
        ...(opts?.json
          ? {
              generationConfig: {
                responseMimeType: "application/json",
              },
            }
          : {}),
      }),
    });
  } catch {
    throw new AiError(
      "Could not reach the AI service. Please try again.",
      503,
    );
  }

  if (res.status === 429) {
    throw new AiError(
      "Gemini is busy right now. Please retry in a moment.",
      429,
    );
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Gemini API error:", res.status, errorText);

    throw new AiError(
      "The AI service returned an error. Please try again.",
      res.status,
    );
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");

  if (!content) {
    throw new AiError(
      "The AI service returned an empty response.",
      502,
    );
  }

  return content;
}

export async function chatJson<T>(messages: Msg[]): Promise<T> {
  const raw = await chat(messages, { json: true });

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        // fall through
      }
    }

    throw new AiError(
      "The AI response could not be understood. Please try again.",
      502,
    );
  }
}
