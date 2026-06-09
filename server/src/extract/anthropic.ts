/**
 * Thin Anthropic Messages API client for bill extraction (raw fetch, no SDK).
 *
 * Sends the uploaded bill (PDF or image) to a vision-capable Claude model and
 * forces a single tool call whose arguments are the structured 42 fields, each
 * with a per-field confidence. Forced tool-use is our structured-output
 * mechanism — we get a validated JSON object back, not free text to parse.
 *
 * Model is configurable via EXTRACT_MODEL; defaults to claude-opus-4-8 (most
 * capable). For high volume you can set EXTRACT_MODEL=claude-haiku-4-5 to trade
 * some accuracy for ~5x lower cost — that's a deployment decision, set by env.
 */

import { FIELD_KEYS, fieldReferenceText } from "./bill-field-defs";

const API_URL =
  (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, "") +
  "/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-opus-4-8";
const TOOL_NAME = "emit_bill_fields";

export type RawField = { key: string; value: string; confidence: number };
export type ExtractCall = {
  fields: RawField[];
  model: string;
  stopReason: string | null;
  usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number };
};

export function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function extractModel(): string {
  return process.env.EXTRACT_MODEL?.trim() || DEFAULT_MODEL;
}

const SUPPORTED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/** Build the document/image content block from the uploaded file. */
function sourceBlock(mimetype: string, base64: string): Record<string, unknown> {
  if (mimetype === "application/pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    };
  }
  if (SUPPORTED_IMAGE.has(mimetype)) {
    return {
      type: "image",
      source: { type: "base64", media_type: mimetype, data: base64 },
    };
  }
  throw new UnsupportedMediaError(mimetype);
}

export class UnsupportedMediaError extends Error {
  constructor(public mimetype: string) {
    super(`Unsupported file type: ${mimetype}. Upload a PDF, JPEG, PNG or WebP.`);
    this.name = "UnsupportedMediaError";
  }
}

export class ExtractionError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ExtractionError";
  }
}

// The tool is the structured-output schema. `fields` is an array so the model
// reports ONLY what it can read — omission is meaningful (no false positives).
const SYSTEM_PROMPT = [
  "You are a meticulous data-entry clerk for Indian electricity bills (DISCOM bills such as MSEDCL, BESCOM, TANGEDCO, TPDDL, Adani, Torrent, etc.).",
  "You are given one electricity bill as a PDF or image — it may be a clean digital PDF or a low-quality phone scan.",
  "Your only job is to transcribe the fields that are actually printed on the bill into the emit_bill_fields tool.",
  "",
  "Hard rules:",
  "1. Transcribe only what is printed. If a field is absent, illegible, or you are unsure, OMIT it entirely. Never infer, derive, calculate, or guess a value — a missing field is correct and expected.",
  "2. Numbers: strip currency symbols, units, and thousands separators. Report 428000 not '4,28,000' and not '₹4,28,000'. Use a leading minus for credits/rebates only where the field hint says so.",
  "3. Power factor: report as a 0–1 decimal (if the bill shows 96 or 96%, report 0.96).",
  "4. Dates: report as DD-MM-YYYY. Date-times as 'DD-MM-YYYY HH:MM'.",
  "5. confidence is your own 0.0–1.0 certainty that you read the printed value correctly (legibility + label match). Use < 0.8 when the text is faint, handwritten, ambiguous, or the label is a non-standard synonym.",
  "6. Map DISCOM-specific labels to the canonical keys below by meaning, not by exact wording.",
  "",
  "Field reference (canonical key — label: meaning):",
  fieldReferenceText(),
].join("\n");

const TOOL = {
  name: TOOL_NAME,
  description:
    "Record the fields read from the electricity bill. Include an entry ONLY for fields actually printed and legible on the bill; omit everything else.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      fields: {
        type: "array",
        description: "One entry per field found on the bill.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: {
              type: "string",
              enum: FIELD_KEYS,
              description: "Canonical field key.",
            },
            value: {
              type: "string",
              description: "Transcribed value, normalised per the system rules.",
            },
            confidence: {
              type: "number",
              description: "0.0–1.0 certainty this value was read correctly.",
            },
          },
          required: ["key", "value", "confidence"],
        },
      },
    },
    required: ["fields"],
  },
  // Cache the stable prefix (tools + system) across every bill. The per-bill
  // PDF lives in `messages`, after this breakpoint, so it never invalidates it.
  cache_control: { type: "ephemeral" as const },
};

const USER_TEXT =
  "Transcribe this electricity bill into the emit_bill_fields tool. Only include fields that are actually printed and legible; omit anything you cannot read or that is not present.";

type AnthropicContentBlock = {
  type: string;
  name?: string;
  input?: { fields?: unknown };
};
type AnthropicResponse = {
  content?: AnthropicContentBlock[];
  stop_reason?: string | null;
  model?: string;
  usage?: ExtractCall["usage"];
  error?: { type: string; message: string };
};

async function callOnce(body: string): Promise<AnthropicResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body,
  });
  const json = (await res.json().catch(() => null)) as AnthropicResponse | null;
  if (!res.ok) {
    const msg = json?.error?.message ?? `${res.status} ${res.statusText}`;
    throw new ExtractionError(`Anthropic API error: ${msg}`, res.status);
  }
  if (!json) throw new ExtractionError("Empty response from Anthropic API");
  return json;
}

const RETRYABLE = new Set([429, 500, 502, 503, 529]);

/** Extract the 42 fields from an uploaded bill via one forced tool call. */
export async function extractBillFields(file: {
  buffer: Buffer;
  mimetype: string;
}): Promise<ExtractCall> {
  if (!isConfigured()) {
    throw new ExtractionError("Extraction is not configured (ANTHROPIC_API_KEY unset).", 503);
  }

  const block = sourceBlock(file.mimetype, file.buffer.toString("base64"));
  const body = JSON.stringify({
    model: extractModel(),
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: [block, { type: "text", text: USER_TEXT }] }],
  });

  let json: AnthropicResponse | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      json = await callOnce(body);
      break;
    } catch (err) {
      lastErr = err;
      const status = err instanceof ExtractionError ? err.status : undefined;
      if (status && RETRYABLE.has(status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  if (!json) throw (lastErr instanceof Error ? lastErr : new ExtractionError("Extraction failed"));

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

  const rawFields = Array.isArray(toolBlock.input?.fields) ? toolBlock.input!.fields! : [];
  const fields: RawField[] = (rawFields as unknown[])
    .map((f) => f as Partial<RawField>)
    .filter((f) => typeof f.key === "string" && typeof f.value === "string")
    .map((f) => ({
      key: f.key as string,
      value: (f.value as string).trim(),
      confidence:
        typeof f.confidence === "number" ? Math.max(0, Math.min(1, f.confidence)) : 0.5,
    }))
    .filter((f) => f.value.length > 0);

  return {
    fields,
    model: json.model ?? extractModel(),
    stopReason: json.stop_reason ?? null,
    usage: json.usage ?? { input_tokens: 0, output_tokens: 0 },
  };
}
