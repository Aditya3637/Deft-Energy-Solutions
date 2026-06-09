import * as M from "@/lib/mock/bill";
import { getApiBase, isApiConfigured } from "@/lib/api/client";

export type { ExtractedField } from "@/lib/mock/bill";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export type ExtractOutcome = {
  fields: M.ExtractedField[];
  /** true → real OCR from the backend; false → sample fallback. */
  live: boolean;
  model?: string;
  found?: number;
  total?: number;
  /** Set when we fell back to the sample (no backend / extraction failed). */
  note?: string;
};

type ServerExtract = {
  fields: M.ExtractedField[];
  model: string;
  found: number;
  total: number;
  lowConfidence: string[];
  source: string;
};

function sample(note?: string): ExtractOutcome {
  return { fields: M.SAMPLE_FIELDS.map((f) => ({ ...f })), live: false, note };
}

export const extract = {
  /**
   * Real bill extraction (Stage G). Uploads the chosen file to POST /v1/extract
   * when a backend is configured; otherwise (or on any failure) falls back to
   * the sample bill so the walkthrough still works offline / on the static demo.
   */
  async fromFile(file: File | null): Promise<ExtractOutcome> {
    if (!file) return sample();
    if (!isApiConfigured()) {
      return sample("No live backend configured — showing a sample bill.");
    }

    const form = new FormData();
    form.append("file", file, file.name);

    try {
      const res = await fetch(`${getApiBase()}/v1/extract`, {
        method: "POST",
        headers: { "x-org-id": DEMO_ORG_ID },
        body: form,
      });
      if (!res.ok) {
        let msg = `Extraction failed (${res.status}).`;
        try {
          const body = (await res.json()) as { message?: string };
          if (body?.message) msg = body.message;
        } catch {
          /* keep default */
        }
        return sample(`${msg} Showing a sample bill instead.`);
      }
      const data = (await res.json()) as ServerExtract;
      if (!Array.isArray(data.fields) || data.fields.length === 0) {
        return sample("Couldn't read this file — showing a sample bill.");
      }
      return {
        fields: data.fields,
        live: true,
        model: data.model,
        found: data.found,
        total: data.total,
      };
    } catch {
      return sample("Couldn't reach the extraction service — showing a sample bill.");
    }
  },
};
