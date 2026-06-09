import { SAMPLE_FIELDS } from "@/lib/mock/bill";
import {
  apiFetch,
  getApiBase,
  isApiConfigured,
  liveServer,
  NO_STORE,
} from "@/lib/api/client";

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
  /** DISCOM whose template was applied at extraction ("" / unset = none). */
  templateApplied?: string;
  fieldsTotal: number;
  fieldsFound: number;
  corrections: CorrectionItem[];
};

/** A with/without-template accuracy slice. */
export type AccuracyBucket = {
  samples: number;
  corrections: number;
  accuracyPct: number | null;
};
export type DiscomAccuracy = {
  discom: string;
  samples: number;
  accuracyPct: number | null;
  corrections: number;
  templated: AccuracyBucket;
  untemplated: AccuracyBucket;
};
export type FieldAccuracy = {
  fieldKey: string;
  seen: number;
  corrected: number;
  accuracyPct: number | null;
};
export type AccuracySummary = {
  window: number;
  overallAccuracyPct: number | null;
  fieldsSeen: number;
  corrections: number;
  templated: AccuracyBucket;
  untemplated: AccuracyBucket;
  byDiscom: DiscomAccuracy[];
  byField: FieldAccuracy[];
};

/** key → human label, from the canonical bill field defs. */
const LABELS: Record<string, string> = Object.fromEntries(
  SAMPLE_FIELDS.map((f) => [f.key, f.label]),
);
export function fieldLabel(key: string): string {
  return LABELS[key] ?? key;
}

/**
 * Demo accuracy used by the static Pages build (and as a fallback). Numbers are
 * illustrative targets — the live view comes from real captured corrections on
 * Vercel SSR. Internally consistent: byDiscom samples sum to `window`.
 */
export const ACCURACY_FIXTURE: AccuracySummary = {
  window: 60,
  overallAccuracyPct: 86.8,
  fieldsSeen: 589,
  corrections: 78,
  templated: { samples: 24, corrections: 20, accuracyPct: 92.7 },
  untemplated: { samples: 36, corrections: 58, accuracyPct: 81.5 },
  byDiscom: [
    {
      discom: "MSEDCL (Mahavitaran)", samples: 26, accuracyPct: 88.1, corrections: 34,
      templated: { samples: 12, corrections: 12, accuracyPct: 91.0 },
      untemplated: { samples: 14, corrections: 22, accuracyPct: 84.5 },
    },
    {
      discom: "BESCOM", samples: 12, accuracyPct: 92.6, corrections: 12,
      templated: { samples: 5, corrections: 4, accuracyPct: 94.2 },
      untemplated: { samples: 7, corrections: 8, accuracyPct: 90.5 },
    },
    {
      discom: "TANGEDCO", samples: 9, accuracyPct: 84.0, corrections: 16,
      templated: { samples: 3, corrections: 3, accuracyPct: 89.0 },
      untemplated: { samples: 6, corrections: 13, accuracyPct: 80.5 },
    },
    {
      discom: "Tata Power-DDL", samples: 7, accuracyPct: 93.4, corrections: 8,
      templated: { samples: 2, corrections: 1, accuracyPct: 96.0 },
      untemplated: { samples: 5, corrections: 7, accuracyPct: 91.0 },
    },
    {
      discom: "Adani Electricity Mumbai", samples: 6, accuracyPct: 91.2, corrections: 8,
      templated: { samples: 2, corrections: 1, accuracyPct: 95.5 },
      untemplated: { samples: 4, corrections: 7, accuracyPct: 88.0 },
    },
  ],
  byField: [
    { fieldKey: "mdDateTime", seen: 48, corrected: 17, accuracyPct: 64.6 },
    { fieldKey: "meterNumber", seen: 51, corrected: 14, accuracyPct: 72.5 },
    { fieldKey: "transformerLossPct", seen: 22, corrected: 6, accuracyPct: 72.7 },
    { fieldKey: "pfPenaltyRatePct", seen: 30, corrected: 7, accuracyPct: 76.7 },
    { fieldKey: "todShoulderRate", seen: 26, corrected: 5, accuracyPct: 80.8 },
    { fieldKey: "reactiveKvarh", seen: 44, corrected: 7, accuracyPct: 84.1 },
    { fieldKey: "apparentKvah", seen: 40, corrected: 5, accuracyPct: 87.5 },
    { fieldKey: "loadFactorPct", seen: 35, corrected: 4, accuracyPct: 88.6 },
    { fieldKey: "billingDemandKva", seen: 55, corrected: 5, accuracyPct: 90.9 },
    { fieldKey: "powerFactor", seen: 58, corrected: 4, accuracyPct: 93.1 },
    { fieldKey: "energyKwh", seen: 60, corrected: 2, accuracyPct: 96.7 },
    { fieldKey: "totalAmountDue", seen: 60, corrected: 1, accuracyPct: 98.3 },
    { fieldKey: "consumerNumber", seen: 60, corrected: 1, accuracyPct: 98.3 },
  ],
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

  /**
   * Per-DISCOM / per-field accuracy rollup for the dashboard. Live on Vercel SSR
   * (real captured corrections); the static Pages build bakes the fixture.
   */
  async accuracy(): Promise<AccuracySummary> {
    if (liveServer()) {
      try {
        return await apiFetch<AccuracySummary>("/v1/corrections/accuracy", NO_STORE);
      } catch {
        return ACCURACY_FIXTURE;
      }
    }
    return ACCURACY_FIXTURE;
  },
};
