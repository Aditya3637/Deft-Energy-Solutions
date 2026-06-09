import { Injectable } from "@nestjs/common";

import { FIELD_DEFS, defForKey } from "./bill-field-defs";
import { extractBillFields, extractModel, isConfigured, type RawField } from "./anthropic";

/** Matches the frontend `ExtractedField` shape (lib/mock/bill.ts) 1:1. */
export type ExtractedField = {
  key: string;
  label: string;
  group: string;
  unit?: string;
  value: string;
  confidence: number;
};

export type ExtractResult = {
  fields: ExtractedField[];
  model: string;
  /** How many of the 42 fields the model could read off the bill. */
  found: number;
  total: number;
  /** Fields read with confidence below the review threshold (0.8). */
  lowConfidence: string[];
  source: "vision";
};

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

  async extract(file: { buffer: Buffer; mimetype: string }): Promise<ExtractResult> {
    const call = await extractBillFields(file);

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

    return {
      fields,
      model: call.model || extractModel(),
      found: fields.filter((f) => f.value.length > 0).length,
      total: FIELD_DEFS.length,
      lowConfidence,
      source: "vision",
    };
  }
}
