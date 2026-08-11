const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "openai/gpt-oss-20b";

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
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    throw new AiError("The AI service is not configured yet.", 500);
  }

  const groqMessages = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  let res: Response;

  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        ...(opts?.json
          ? {
              response_format: {
                type: "json_object",
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
      "Groq is busy right now. Please try again in a moment.",
      429,
    );
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Groq API error:", res.status, errorText);

    throw new AiError(
      "The AI service returned an error. Please try again.",
      res.status,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

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
        // Fall through.
      }
    }

    throw new AiError(
      "The AI response could not be understood. Please try again.",
      502,
    );
  }
}
