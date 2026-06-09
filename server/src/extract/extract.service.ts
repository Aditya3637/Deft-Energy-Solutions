import { Injectable } from "@nestjs/common";

import { FIELD_DEFS } from "./bill-field-defs";
import { type ProviderResult } from "./extract-core";
import { type ExtractedField, mergeRawFields } from "./fields";
import {
  extractBill,
  extractBillText,
  isConfigured,
  providerModel,
  providerName,
  providerSupportsVision,
} from "./provider";
import { extractPdfText, hasUsableText } from "./pdf-text";
import { resolveTemplate, templateHintBlock } from "./discom-templates";

export type { ExtractedField } from "./fields";

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
  /** DISCOM whose template was applied (explicit hint or auto-detected), if any. */
  templateApplied: string | null;
};

/** Below this field count a text-layer parse is treated as too weak (junk text). */
const MIN_TEXT_FIELDS = 6;

@Injectable()
export class ExtractService {
  isConfigured(): boolean {
    return isConfigured();
  }

  /**
   * @param discomHint optional DISCOM slug/name (from a picker) to load that
   *        utility's extraction template; on the text path we also auto-detect.
   */
  async extract(
    file: { buffer: Buffer; mimetype: string },
    discomHint?: string,
  ): Promise<ExtractResult> {
    let call: ProviderResult;
    let source: ExtractSource = "vision";
    // Explicit hint (if any) gives us a template up front, even for vision.
    let template = resolveTemplate({ hint: discomHint });

    // Digital-PDF fast path: if the PDF carries a usable text layer, structure
    // the text (cheap, and the only PDF path the free `openai` provider has).
    if (file.mimetype === "application/pdf") {
      const text = await extractPdfText(file.buffer);
      if (hasUsableText(text)) {
        // Auto-detect the DISCOM from the text layer when not hinted.
        if (!template) template = resolveTemplate({ text });
        const hint = template ? templateHintBlock(template) : undefined;
        call = await extractBillText(text, hint);
        source = "pdf-text";
        // If the text layer turned out junk (few fields) and the provider can do
        // vision (Anthropic), fall back to OCR-ing the PDF directly.
        if (mergeRawFields(call.fields).found < MIN_TEXT_FIELDS && providerSupportsVision()) {
          call = await extractBill(file, hint);
          source = "vision";
        }
      } else {
        // Scanned PDF, no text layer → vision (Anthropic; openai throws a hint).
        call = await extractBill(file, template ? templateHintBlock(template) : undefined);
        source = "vision";
      }
    } else {
      call = await extractBill(file, template ? templateHintBlock(template) : undefined);
      source = "vision";
    }

    const { fields, lowConfidence, found } = mergeRawFields(call.fields);
    return {
      fields,
      model: call.model || providerModel(),
      provider: providerName(),
      found,
      total: FIELD_DEFS.length,
      lowConfidence,
      source,
      templateApplied: template?.discom ?? null,
    };
  }
}
