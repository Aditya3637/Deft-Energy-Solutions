/**
 * Shared field model + merge used by every intake channel (upload OCR/text,
 * and BBPS/portal fetch). Takes a provider's RawField[] and projects it onto
 * the full 42-row template the review screen renders.
 */

import { FIELD_DEFS, defForKey } from "./bill-field-defs";
import type { RawField } from "./extract-core";

/** Matches the frontend `ExtractedField` shape (lib/mock/bill.ts) 1:1. */
export type ExtractedField = {
  key: string;
  label: string;
  group: string;
  unit?: string;
  value: string;
  confidence: number;
};

/** Drop ₹/commas/units from a numeric field's text; keep sign & decimals. */
export function normaliseNumber(raw: string): string {
  return raw.replace(/[₹,\s]/g, "").replace(/[^0-9.\-]/g, "");
}

/** Project raw {key,value,confidence} entries onto all 42 fields (empty where absent). */
export function mergeRawFields(raw: RawField[]): {
  fields: ExtractedField[];
  lowConfidence: string[];
  found: number;
} {
  // Highest-confidence wins if a key appears twice.
  const best = new Map<string, RawField>();
  for (const f of raw) {
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
