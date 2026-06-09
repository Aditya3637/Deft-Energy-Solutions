/**
 * Collection connectors — the money-movement seam. A connector settles a batch
 * of confirmed collections to the DISCOM and reports the provider reference.
 *
 * REAL MONEY plugs in HERE: a BBPS Agent-Institution aggregator (Setu /
 * BillAvenue / Cashfree), a DISCOM's DIRECT agency API, or a payment gateway +
 * sponsor/nodal bank. None of that exists in code alone — it needs the license,
 * a settlement bank, and credentials. Until then we use the `mock` connector
 * (deterministic, no funds move) so the system-of-record is exercised end-to-end.
 *
 * Settlement model: we remit the GROSS to the DISCOM and the commission is our
 * receivable/earning (gross-remit). Net vs gross can be made per-license later.
 */

import type { CollectionMode } from "@prisma/client";

export type RemitRequest = {
  discom: string;
  periodDate: string; // ISO
  grossPaise: number;
  commissionPaise: number;
  count: number;
};
export type RemitResult = {
  providerRef: string;
  remittedPaise: number;
  settled: boolean;
};

export interface CollectionConnector {
  readonly id: string;
  remit(req: RemitRequest): Promise<RemitResult>;
}

/** Deterministic stub — records a settlement without moving real funds. */
const mockConnector: CollectionConnector = {
  id: "mock",
  async remit(req) {
    return {
      providerRef: `mock-${req.discom}-${req.periodDate.slice(0, 10)}`,
      remittedPaise: req.grossPaise, // full gross to the DISCOM; commission is our receivable
      settled: true,
    };
  },
};

/**
 * Pick the connector for a license. Real connectors (keyed by mode + aggregator)
 * register here once credentials exist; everything falls back to `mock` so the
 * flow is demoable and safe. `COLLECTIONS_LIVE` is the future gate for real rails.
 */
export function selectConnector(_mode: CollectionMode, _aggregator: string): CollectionConnector {
  // e.g. if (process.env.COLLECTIONS_LIVE && mode === "BBPS") return bbpsConnector(aggregator);
  return mockConnector;
}
