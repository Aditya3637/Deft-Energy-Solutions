/**
 * OpenAI-compatible chat-completions provider (raw fetch, no SDK). One client
 * for every host that speaks the OpenAI `/chat/completions` shape:
 *
 *   Groq          EXTRACT_BASE_URL=https://api.groq.com/openai/v1
 *                 EXTRACT_MODEL=meta-llama/llama-4-scout-17b-16e-instruct   (free tier)
 *   Meta Llama    EXTRACT_BASE_URL=https://api.llama.com/compat/v1
 *                 EXTRACT_MODEL=Llama-4-Maverick-17B-128E-Instruct-FP8       (free preview)
 *   OpenRouter    EXTRACT_BASE_URL=https://openrouter.ai/api/v1
 *                 EXTRACT_MODEL=meta-llama/llama-3.2-11b-vision-instruct:free
 *   Together      EXTRACT_BASE_URL=https://api.together.xyz/v1
 *   Gemini-compat EXTRACT_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
 *                 EXTRACT_MODEL=gemini-2.0-flash                             (free tier)
 *   Ollama (self) EXTRACT_BASE_URL=http://localhost:11434/v1   (no key — $0/call)
 *                 EXTRACT_MODEL=llama3.2-vision
 *
 * IMPORTANT: these endpoints take IMAGES, not PDFs. Upload a photo/screenshot,
 * or use the Anthropic provider for PDFs. Structured output is by JSON prompt +
 * defensive parse (broadest compatibility); set EXTRACT_JSON_MODE=1 to also send
 * response_format:{type:"json_object"} on hosts that support it.
 */

import {
  ExtractionError,
  ProviderResult,
  SUPPORTED_IMAGE,
  SYSTEM_PROMPT,
  USER_TEXT,
  UnsupportedMediaError,
  coerceRawFields,
  withRetry,
} from "./extract-core";

function baseUrl(): string {
  return (process.env.EXTRACT_BASE_URL ?? "").trim().replace(/\/$/, "");
}

export function openaiConfigured(): boolean {
  return !!baseUrl() && !!process.env.EXTRACT_MODEL?.trim();
}

export function openaiModel(): string {
  return process.env.EXTRACT_MODEL?.trim() || "";
}

const JSON_INSTRUCTION =
  'Respond with ONLY a JSON object of the form {"fields":[{"key":"...","value":"...","confidence":0.0}]}. ' +
  "Use the canonical keys from the field reference above. No prose, no markdown code fences.";

type ChatResponse = {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string } | string;
};

/** Pull the first JSON object out of a model's text reply (handles fences/prose). */
function parseFields(content: string): unknown {
  const cleaned = content.replace(/```(?:json)?/gi, "").trim();
  try {
    return (JSON.parse(cleaned) as { fields?: unknown }).fields;
  } catch {
    /* fall through to substring scan */
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return (JSON.parse(cleaned.slice(start, end + 1)) as { fields?: unknown }).fields;
    } catch {
      /* give up below */
    }
  }
  throw new ExtractionError("The model did not return parseable JSON. Try a different EXTRACT_MODEL.");
}

export async function extractViaOpenAI(file: {
  buffer: Buffer;
  mimetype: string;
}): Promise<ProviderResult> {
  if (!openaiConfigured()) {
    throw new ExtractionError(
      "OpenAI-compatible provider not configured (set EXTRACT_BASE_URL and EXTRACT_MODEL).",
      503,
    );
  }
  if (file.mimetype === "application/pdf") {
    throw new UnsupportedMediaError(
      "application/pdf (this provider accepts images only — upload a photo/screenshot, or set EXTRACT_PROVIDER=anthropic for PDFs)",
    );
  }
  if (!SUPPORTED_IMAGE.has(file.mimetype)) {
    throw new UnsupportedMediaError(file.mimetype);
  }

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const payload: Record<string, unknown> = {
    model: openaiModel(),
    max_tokens: 4096,
    temperature: 0,
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${JSON_INSTRUCTION}` },
      {
        role: "user",
        content: [
          { type: "text", text: USER_TEXT },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      },
    ],
  };
  if (process.env.EXTRACT_JSON_MODE?.trim()) {
    payload.response_format = { type: "json_object" };
  }
  const body = JSON.stringify(payload);

  const key = process.env.EXTRACT_API_KEY?.trim();
  const json = await withRetry<ChatResponse>(async () => {
    const res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      body,
    });
    const j = (await res.json().catch(() => null)) as ChatResponse | null;
    if (!res.ok) {
      const msg =
        typeof j?.error === "string" ? j.error : j?.error?.message ?? `${res.status} ${res.statusText}`;
      throw new ExtractionError(`Extraction API error: ${msg}`, res.status);
    }
    if (!j) throw new ExtractionError("Empty response from extraction API");
    return j;
  });

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new ExtractionError("The model returned no content. The image may be unreadable.");
  }
  return { fields: coerceRawFields(parseFields(content)), model: openaiModel() };
}
