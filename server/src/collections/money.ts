/**
 * Money helpers + commission math for the collection-agent layer.
 *
 * MONEY IS INTEGER PAISE. Stored as BigInt in the DB (no overflow at scale);
 * this module works in `number` paise (safe to ~9e15 ≈ ₹9 lakh crore, far beyond
 * any bill) and rounds with Math.floor so we never over-credit commission.
 *
 * Keep this pure and dependency-free — it is exercised by the CI money-invariant
 * check (server/scripts/collections-check.ts). Real money rides on it.
 */

export type CommissionType = "PER_TXN" | "PERCENT" | "PERCENT_SPLIT";

export type CommissionModel = {
  type: CommissionType;
  perTxnPaise: number;
  rateBps: number; // PERCENT
  currentBps: number; // PERCENT_SPLIT (current dues)
  outstandingBps: number; // PERCENT_SPLIT (arrears)
  capPaise: number; // 0 = no cap
  minPaise: number; // 0 = no floor
};

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);
export const paiseToRupees = (paise: number): number => Math.round(paise) / 100;

/**
 * Commission the agent earns on one collection. Deterministic, integer paise,
 * floored (never rounds up), clamped to [0, amount], then to the model's
 * min/cap. `isOutstanding` selects the arrears rate under PERCENT_SPLIT.
 */
export function commissionPaise(
  model: CommissionModel,
  amountPaise: number,
  isOutstanding = false,
): number {
  const amt = Math.max(0, Math.floor(amountPaise));
  if (amt === 0) return 0;

  let raw: number;
  switch (model.type) {
    case "PER_TXN":
      raw = Math.max(0, Math.floor(model.perTxnPaise));
      break;
    case "PERCENT":
      raw = Math.floor((amt * Math.max(0, model.rateBps)) / 10_000);
      break;
    case "PERCENT_SPLIT": {
      const bps = isOutstanding ? model.outstandingBps : model.currentBps;
      raw = Math.floor((amt * Math.max(0, bps)) / 10_000);
      break;
    }
    default:
      raw = 0;
  }

  // A floor (min) only applies when some commission is due; a cap always caps.
  if (model.minPaise > 0 && raw > 0) raw = Math.max(raw, model.minPaise);
  if (model.capPaise > 0) raw = Math.min(raw, model.capPaise);
  // Commission can never exceed the money collected.
  return Math.min(raw, amt);
}
