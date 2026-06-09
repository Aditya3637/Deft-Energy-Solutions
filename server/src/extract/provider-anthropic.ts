/**
 * Anthropic Messages API provider (raw fetch, no SDK). Highest-accuracy path
 * and the only one that accepts PDFs directly (digital or scanned) plus images.
 * Structured output via forced tool use; stable prefix is prompt-cached.
 */

import {
  ExtractionError,
  FIELDS_SCHEMA,
  ProviderResult,
  SUPPORTED_IMAGE,
  SYSTEM_PROMPT,
  TOOL_NAME,
  UnsupportedMediaError,
  USER_TEXT,
  coerceRawFields,
  withRetry,
} from "./extract-core";

const API_URL =
  (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, "") +
  "/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-opus-4-8";

export function anthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function anthropicModel(): string {
  return process.env.EXTRACT_MODEL?.trim() || DEFAULT_MODEL;
}

function sourceBlock(mimetype: string, base64: string): Record<string, unknown> {
  if (mimetype === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
  }
  if (SUPPORTED_IMAGE.has(mimetype)) {
    return { type: "image", source: { type: "base64", media_type: mimetype, data: base64 } };
  }
  throw new UnsupportedMediaError(mimetype);
}

const TOOL = {
  name: TOOL_NAME,
  description:
    "Record the fields read from the electricity bill. Include an entry ONLY for fields actually printed and legible on the bill; omit everything else.",
  input_schema: FIELDS_SCHEMA,
  // Cache the stable prefix (tools + system); the per-bill PDF sits after it.
  cache_control: { type: "ephemeral" as const },
};

type AnthropicResponse = {
  content?: { type: string; name?: string; input?: { fields?: unknown } }[];
  stop_reason?: string | null;
  model?: string;
  error?: { type: string; message: string };
};

export async function extractViaAnthropic(file: {
  buffer: Buffer;
  mimetype: string;
}): Promise<ProviderResult> {
  if (!anthropicConfigured()) {
    throw new ExtractionError("Anthropic provider not configured (ANTHROPIC_API_KEY unset).", 503);
  }

  const block = sourceBlock(file.mimetype, file.buffer.toString("base64"));
  const body = JSON.stringify({
    model: anthropicModel(),
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: [block, { type: "text", text: USER_TEXT }] }],
  });

  const json = await withRetry<AnthropicResponse>(async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body,
    });
    const j = (await res.json().catch(() => null)) as AnthropicResponse | null;
    if (!res.ok) {
      throw new ExtractionError(
        `Anthropic API error: ${j?.error?.message ?? `${res.status} ${res.statusText}`}`,
        res.status,
      );
    }
    if (!j) throw new ExtractionError("Empty response from Anthropic API");
    return j;
  });

  const toolBlock = (json.content ?? []).find(
    (b) => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!toolBlock) {
    throw new ExtractionError(
      json.stop_reason === "refusal"
        ? "The model declined to process this document."
        : "The model did not return structured fields. The file may not be a readable electricity bill.",
    );
  }

  return {
    fields: coerceRawFields(toolBlock.input?.fields),
    model: json.model ?? anthropicModel(),
  };
}
