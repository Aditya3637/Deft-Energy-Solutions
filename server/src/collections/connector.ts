/**
 * Collection connectors — the money-movement seam.
 *
 * REAL MONEY plugs in HERE: a BBPS Agent-Institution aggregator (Setu /
 * BillAvenue / Cashfree), a DISCOM's DIRECT agency API, or a payment gateway +
 * sponsor/nodal bank. `mock` is the default (deterministic, no funds move) so the
 * system-of-record is exercised end-to-end. A real rail is selected only when
 * `COLLECTIONS_LIVE` is set AND the rail's credentials are configured.
 *
 * Two operations:
 *  - payBill — pay a single bill through the rail (BBPS bill-payment); idempotent
 *    via `referenceId`. The per-consumer money move.
 *  - remit   — settle a batch to the DISCOM (DIRECT mode). On BBPS the aggregator
 *    settles to the biller T+1, so this just records that.
 */

import type { CollectionMode } from "@prisma/client";

import { bbpsConfigured, bbpsConnector } from "./connector-bbps";

export type PayBillRequest = {
  billerId: string;
  consumerParams: Record<string, string>;
  amountPaise: number;
  referenceId: string; // our idempotencyKey — dedupes retries at the rail
};
export type PayBillResult = {
  providerRef: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  message?: string;
};

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
  payBill(req: PayBillRequest): Promise<PayBillResult>;
  remit(req: RemitRequest): Promise<RemitResult>;
}

/** Deterministic stub — records collections/settlements without moving real funds. */
const mockConnector: CollectionConnector = {
  id: "mock",
  async payBill(req) {
    return { providerRef: `mock-pay-${req.referenceId}`, status: "SUCCESS" };
  },
  async remit(req) {
    return {
      providerRef: `mock-${req.discom}-${req.periodDate.slice(0, 10)}`,
      remittedPaise: req.grossPaise, // full gross to the DISCOM; commission is our receivable
      settled: true,
    };
  },
};

/**
 * Pick the connector for a license. The real BBPS connector is used only when
 * `COLLECTIONS_LIVE` is set, credentials are configured, AND the license is BBPS
 * mode; otherwise everything falls back to `mock` so the flow is safe and
 * demoable. DIRECT/MANUAL real rails register here later.
 */
export function selectConnector(mode: CollectionMode, _aggregator: string): CollectionConnector {
  if (process.env.COLLECTIONS_LIVE?.trim() && mode === "BBPS" && bbpsConfigured()) {
    return bbpsConnector;
  }
  return mockConnector;
}
