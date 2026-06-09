import { Injectable } from "@nestjs/common";

import { FIELD_DEFS, defForKey } from "./bill-field-defs";
import { type ProviderResult, type RawField } from "./extract-core";
import {
  extractBill,
  extractBillText,
  isConfigured,
  providerModel,
  providerName,
  providerSupportsVision,
} from "./provider";
import { extractPdfText, hasUsableText } from "./pdf-text";

/** Matches the frontend `ExtractedField` shape (lib/mock/bill.ts) 1:1. */
export type ExtractedField = {
  key: string;
  label: string;
  group: string;
  unit?: string;
  value: string;
  confidence: number;
};

export type ExtractSource = "pdf-text" | "vision";

export type ExtractResult = {
  fields: ExtractedField[];
  model: string;
  provider: string;
  /** How many of the 42 fields the model could read off the bill. */
  found: number;
  total: number;
  /** Fields read with confidence below the review threshold (0.8). */
  lowConfidence: string[];
  /** Which path produced the result: the PDF's text layer, or vision OCR. */
  source: ExtractSource;
};

/** Below this field count a text-layer parse is treated as too weak (junk text). */
const MIN_TEXT_FIELDS = 6;

/** Normalise a numeric field's text: drop ₹/commas/units, keep sign & decimals. */
function normaliseNumber(raw: string): string {
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/[^0-9.\-]/g, "");
  return cleaned;
}

@Injectable()
export class ExtractService {
  isConfigured(): boolean {
    return isConfigured();
  }

  /** Merge raw provider fields into the full 42-row template. */
  private merge(call: ProviderResult): { fields: ExtractedField[]; lowConfidence: string[]; found: number } {
    // Highest-confidence wins if the model emits a key twice.
    const best = new Map<string, RawField>();
    for (const f of call.fields) {
      const def = defForKey(f.key);
      if (!def) continue;
      const prev = best.get(f.key);
      if (!prev || f.confidence > prev.confidence) best.set(f.key, f);
    }

    const lowConfidence: string[] = [];
    const fields: ExtractedField[] = FIELD_DEFS.map((def) => {
      const hit = best.get(def.key);
      let value = "";
      let confidence = 0;
      if (hit) {
        value = def.kind === "number" ? normaliseNumber(hit.value) : hit.value;
        confidence = value.length ? hit.confidence : 0;
        if (value.length && confidence < 0.8) lowConfidence.push(def.key);
      }
      return {
        key: def.key,
        label: def.label,
        group: def.group,
        ...(def.unit ? { unit: def.unit } : {}),
        value,
        confidence,
      };
    });

    return { fields, lowConfidence, found: fields.filter((f) => f.value.length > 0).length };
  }

  async extract(file: { buffer: Buffer; mimetype: string }): Promise<ExtractResult> {
    let call: ProviderResult;
    let source: ExtractSource = "vision";

    // Digital-PDF fast path: if the PDF carries a usable text layer, structure
    // the text (cheap, and the only PDF path the free `openai` provider has).
    if (file.mimetype === "application/pdf") {
      const text = await extractPdfText(file.buffer);
      if (hasUsableText(text)) {
        call = await extractBillText(text);
        source = "pdf-text";
        // If the text layer turned out junk (few fields) and the provider can do
        // vision (Anthropic), fall back to OCR-ing the PDF directly.
        if (this.merge(call).found < MIN_TEXT_FIELDS && providerSupportsVision()) {
          call = await extractBill(file);
          source = "vision";
        }
      } else {
        // Scanned PDF, no text layer → vision (Anthropic; openai throws a hint).
        call = await extractBill(file);
        source = "vision";
      }
    } else {
      call = await extractBill(file);
      source = "vision";
    }

    const { fields, lowConfidence, found } = this.merge(call);
    return {
      fields,
      model: call.model || providerModel(),
      provider: providerName(),
      found,
      total: FIELD_DEFS.length,
      lowConfidence,
      source,
    };
  }
}
