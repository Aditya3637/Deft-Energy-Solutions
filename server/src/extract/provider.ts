/**
 * Provider selection. EXTRACT_PROVIDER picks the backend:
 *   anthropic (default) — Claude vision; PDFs + images; highest accuracy; paid.
 *   openai              — any OpenAI-compatible host (Llama via Groq / Meta Llama
 *                         API / OpenRouter / Together, Gemini-compat, or self-hosted
 *                         Ollama); images only; free / low-cost tiers available.
 */

import { ProviderResult } from "./extract-core";
import {
  anthropicConfigured,
  anthropicModel,
  extractViaAnthropic,
  extractViaAnthropicText,
} from "./provider-anthropic";
import {
  openaiConfigured,
  openaiModel,
  extractViaOpenAI,
  extractViaOpenAIText,
} from "./provider-openai";

export type ProviderName = "anthropic" | "openai";

export function providerName(): ProviderName {
  return process.env.EXTRACT_PROVIDER?.trim().toLowerCase() === "openai" ? "openai" : "anthropic";
}

export function isConfigured(): boolean {
  return providerName() === "openai" ? openaiConfigured() : anthropicConfigured();
}

export function providerModel(): string {
  return providerName() === "openai" ? openaiModel() : anthropicModel();
}

/** True for providers that can OCR an image/PDF directly (used for fallback). */
export function providerSupportsVision(): boolean {
  return providerName() === "anthropic";
}

/** Vision path — OCR the raw file (PDF or image), with an optional DISCOM hint. */
export function extractBill(
  file: { buffer: Buffer; mimetype: string },
  hint?: string,
): Promise<ProviderResult> {
  return providerName() === "openai" ? extractViaOpenAI(file, hint) : extractViaAnthropic(file, hint);
}

/** Text path — structure already-extracted bill text, with an optional DISCOM hint. */
export function extractBillText(text: string, hint?: string): Promise<ProviderResult> {
  return providerName() === "openai"
    ? extractViaOpenAIText(text, hint)
    : extractViaAnthropicText(text, hint);
}
