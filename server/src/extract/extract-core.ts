/**
 * Shared building blocks for bill extraction, provider-agnostic.
 *
 * Both the Anthropic provider (provider-anthropic.ts) and the OpenAI-compatible
 * provider (provider-openai.ts, for Llama/Gemini/Groq/Together/OpenRouter/Ollama)
 * reuse the same field reference, prompt, normalisation, retry and error types.
 */

import { FIELD_KEYS, fieldReferenceText } from "./bill-field-defs";

export type RawField = { key: string; value: string; confidence: number };

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

export const SUPPORTED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const TOOL_NAME = "emit_bill_fields";

/** Shared extraction instructions (provider-neutral). */
export const SYSTEM_PROMPT = [
  "You are a meticulous data-entry clerk for Indian electricity bills (DISCOM bills such as MSEDCL, BESCOM, TANGEDCO, TPDDL, Adani, Torrent, etc.).",
  "You are given one electricity bill as a PDF or image — it may be a clean digital PDF or a low-quality phone scan.",
  "Your only job is to transcribe the fields that are actually printed on the bill.",
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

export const USER_TEXT =
  "Transcribe this electricity bill. Only include fields that are actually printed and legible; omit anything you cannot read or that is not present.";

/** JSON Schema for the `fields` payload — shared by Anthropic tool-use and OpenAI JSON mode. */
export const FIELDS_SCHEMA = {
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
          key: { type: "string", enum: FIELD_KEYS, description: "Canonical field key." },
          value: { type: "string", description: "Transcribed value, normalised per the system rules." },
          confidence: { type: "number", description: "0.0–1.0 certainty this value was read correctly." },
        },
        required: ["key", "value", "confidence"],
      },
    },
  },
  required: ["fields"],
} as const;

/** Coerce a model's raw `fields` array into clean RawField[] (defensive). */
export function coerceRawFields(raw: unknown): RawField[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((f) => f as Partial<RawField>)
    .filter((f) => typeof f?.key === "string" && typeof f?.value === "string")
    .map((f) => ({
      key: f.key as string,
      value: (f.value as string).trim(),
      confidence:
        typeof f.confidence === "number" ? Math.max(0, Math.min(1, f.confidence)) : 0.5,
    }))
    .filter((f) => f.value.length > 0);
}

const RETRYABLE = new Set([429, 500, 502, 503, 529]);

/** Run `fn` with up to 3 attempts, backing off on retryable HTTP statuses. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
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
  throw lastErr instanceof Error ? lastErr : new ExtractionError("Extraction failed");
}

export type ProviderResult = { fields: RawField[]; model: string };
