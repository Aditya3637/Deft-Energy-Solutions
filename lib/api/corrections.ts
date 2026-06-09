import { getApiBase, isApiConfigured } from "@/lib/api/client";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export type CorrectionItem = {
  fieldKey: string;
  extracted: string;
  extractedConfidence: number;
  final: string;
  corrected: boolean;
};

export type CorrectionsPayload = {
  provider: string;
  model?: string;
  source: string;
  discom?: string;
  fieldsTotal: number;
  fieldsFound: number;
  corrections: CorrectionItem[];
};

export type AccuracySummary = {
  window: number;
  overallAccuracyPct: number | null;
  fieldsSeen: number;
  corrections: number;
  byDiscom: { discom: string; samples: number; accuracyPct: number | null; corrections: number }[];
  byField: { fieldKey: string; seen: number; corrected: number; accuracyPct: number | null }[];
};

export const corrections = {
  /**
   * Fire-and-forget: log how the user corrected an extraction. Never throws and
   * never blocks the UI — it's a background training-data signal.
   */
  async submit(payload: CorrectionsPayload): Promise<void> {
    if (!isApiConfigured()) return;
    try {
      await fetch(`${getApiBase()}/v1/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-org-id": DEMO_ORG_ID },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  },

  /** Per-DISCOM / per-field accuracy rollup (for the accuracy dashboard). */
  async accuracy(): Promise<AccuracySummary | null> {
    if (!isApiConfigured()) return null;
    try {
      const res = await fetch(`${getApiBase()}/v1/corrections/accuracy`, {
        headers: { "x-org-id": DEMO_ORG_ID },
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as AccuracySummary;
    } catch {
      /* ignore */
    }
    return null;
  },
};
