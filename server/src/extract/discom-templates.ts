/**
 * Per-DISCOM extraction templates (Stage G — de-risking step 4).
 *
 * When we know (or can detect) which utility a bill is from, we inject a small
 * set of DISCOM-specific cues into the *user* message (not the cached system
 * prompt — keeps the prompt-cache prefix byte-stable). The cues target the
 * fields the accuracy view shows as hardest (MD date/time, billing demand,
 * meter no., PF penalty, FAC, ToD zones) and resolve each DISCOM's quirky
 * labels/layout to the canonical keys.
 *
 * These are seeded from domain knowledge; the corrections-capture loop +
 * accuracy dashboard tell us which to add/refine over time.
 */

import { defForKey } from "./bill-field-defs";

export type DiscomTemplate = {
  id: string; // matches the billfetch biller slug
  discom: string; // display name
  /** Lowercased substrings that identify this DISCOM in bill text / a hint. */
  match: string[];
  /** Per-field cue: canonical key → guidance. */
  hints: { field: string; hint: string }[];
};

export const DISCOM_TEMPLATES: DiscomTemplate[] = [
  {
    id: "msedcl",
    discom: "MSEDCL (Mahavitaran)",
    match: ["msedcl", "mahavitaran", "maharashtra state electricity"],
    hints: [
      { field: "billingDemandKva", hint: "Read the 'Billing Demand' line (kVA) — it differs from 'Contract Demand' and 'Sanctioned Load'; MSEDCL bills the higher of 75% of contract demand or recorded MD." },
      { field: "maxDemandKva", hint: "'Maximum Demand' (a.k.a. Recorded/Actual MD) in kVA, with a date/time sub-line." },
      { field: "mdDateTime", hint: "The MD date & time is the small sub-line next to Maximum Demand, format DD/MM/YYYY HH:MM." },
      { field: "facFppca", hint: "Fuel adjustment is the 'FAC' line (rate ₹/unit × units) — take the amount column." },
      { field: "pfPenaltyAmt", hint: "'P.F. Incentive/Penalty' — a credit (incentive) is negative, a penalty is positive." },
      { field: "todPeakKwh", hint: "ToD zones are labelled A–D (Zone A 22:00–06:00 is off-peak; C/D are peak); map peak energy from the peak zones." },
      { field: "electricityDuty", hint: "Electricity Duty + Tax on Sale of Electricity (TOSE) are separate lines — electricityDuty = the Electricity Duty amount." },
    ],
  },
  {
    id: "bescom",
    discom: "BESCOM",
    match: ["bescom", "bangalore electricity"],
    hints: [
      { field: "consumerNumber", hint: "The consumer id is labelled 'Account ID' (10-digit)." },
      { field: "tariffCategory", hint: "HT tariffs are 'HT-2(a)' industrial / 'HT-2(b)' commercial." },
      { field: "billingDemandKva", hint: "'Billed Demand' in kVA; BESCOM bills 85% of contract demand as the floor." },
      { field: "meterNumber", hint: "Meter serial is under 'Meter Details' with a separate 'MF' (multiplying factor)." },
    ],
  },
  {
    id: "tangedco",
    discom: "TANGEDCO",
    match: ["tangedco", "tamil nadu", "tneb"],
    hints: [
      { field: "tariffCategory", hint: "HT tariffs are 'HT Tariff IA/IB/II'; LT industrial is 'LT-III'." },
      { field: "todPeakRate", hint: "Peak hours surcharge is shown as a % uplift on the normal rate, not a separate ₹/kWh — compute the peak rate accordingly." },
      { field: "maxDemandKva", hint: "'Recorded Demand' in kVA; demand charges use 'Billing Demand'." },
    ],
  },
  {
    id: "tpddl",
    discom: "Tata Power-DDL",
    match: ["tata power-ddl", "tata power delhi", "tpddl", "ndpl"],
    hints: [
      { field: "consumerNumber", hint: "Consumer id is the 'CA No' (contract account, 9-digit)." },
      { field: "fixedDemandCharges", hint: "Delhi bills show 'Fixed Charges' per kW of sanctioned load (not kVA)." },
      { field: "pfPenaltyAmt", hint: "Look for 'Power Factor Surcharge/Rebate'." },
      { field: "electricityDuty", hint: "Electricity tax is 'Electricity Tax @5%' on energy+fixed charges." },
    ],
  },
  {
    id: "bses-rajdhani",
    discom: "BSES Rajdhani / Yamuna",
    match: ["bses", "rajdhani", "yamuna", "brpl", "bypl"],
    hints: [
      { field: "consumerNumber", hint: "Consumer id is the 'CA No' (contract account)." },
      { field: "fixedDemandCharges", hint: "'Fixed Charges' are per kW of sanctioned load." },
      { field: "pfPenaltyAmt", hint: "'Power Factor Surcharge' (penalty) / rebate line." },
      { field: "todPeakKwh", hint: "ToD is shown as Peak/Off-peak energy blocks with separate ₹/kWh." },
    ],
  },
  {
    id: "adani-mumbai",
    discom: "Adani Electricity Mumbai",
    match: ["adani"],
    hints: [
      { field: "wheelingCharges", hint: "'Wheeling Charge' (₹/unit × units) is a distinct line from energy charges." },
      { field: "facFppca", hint: "Fuel adjustment is 'FAC' / 'Fuel Adjustment Charge' (₹/unit)." },
      { field: "billingDemandKva", hint: "'Billing Demand' in kVA; the recorded MD shows a timestamp." },
    ],
  },
  {
    id: "torrent",
    discom: "Torrent Power",
    match: ["torrent"],
    hints: [
      { field: "consumerNumber", hint: "Consumer id is the 'Service Number'." },
      { field: "facFppca", hint: "Fuel adjustment is 'FPPPA' (Fuel & Power Purchase Price Adjustment), ₹/unit." },
      { field: "todPeakKwh", hint: "ToD energy is split into three slabs in the consumption table." },
    ],
  },
];

const BY_ID = new Map(DISCOM_TEMPLATES.map((t) => [t.id, t] as const));

/**
 * Resolve a template from an explicit hint (a billfetch slug or DISCOM name)
 * and/or by scanning extracted bill text for a known DISCOM signature.
 */
export function resolveTemplate(opts: { hint?: string; text?: string }): DiscomTemplate | null {
  const hint = opts.hint?.trim().toLowerCase();
  if (hint) {
    if (BY_ID.has(hint)) return BY_ID.get(hint)!;
    const byMatch = DISCOM_TEMPLATES.find(
      (t) => t.match.some((m) => hint.includes(m)) || t.discom.toLowerCase().includes(hint),
    );
    if (byMatch) return byMatch;
  }
  if (opts.text) {
    const hay = opts.text.toLowerCase();
    const detected = DISCOM_TEMPLATES.find((t) => t.match.some((m) => hay.includes(m)));
    if (detected) return detected;
  }
  return null;
}

/** Render a template's cues as a user-message block (appended after USER_TEXT). */
export function templateHintBlock(tpl: DiscomTemplate): string {
  const lines = tpl.hints.map((h) => {
    const label = defForKey(h.field)?.label ?? h.field;
    return `- ${label} (${h.field}): ${h.hint}`;
  });
  return [
    `This bill appears to be from ${tpl.discom}. Apply these DISCOM-specific cues — they override generic assumptions where they conflict, but never invent a value that isn't printed:`,
    ...lines,
  ].join("\n");
}
