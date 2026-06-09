# Collection-Agent Layer — design, money model & compliance

Deft acting as a **licensed collection agent** for DISCOMs: pull what's due, collect
from consumers, remit to the utility, and earn commission. Real money rides on this,
so the system is built money-safe first; the live rail plugs into a connector seam.

## How DISCOM collection actually works (research)

| Path | What it is | Commission | Settlement |
|---|---|---|---|
| **BBPS / Bharat Connect** | Operate as / under a licensed **Agent Institution** beneath a **BBPOU**; one tie-up reaches *many* DISCOMs. | Per-transaction (flat) | **T+1** clearing via NPCI + sponsor bank |
| **MSEDCL** (direct) | Authorised collection centres / Urjamitra on the mahadiscom portal | **% of collection**, with separate **current vs arrears** rates (≈5% current + ≈10% outstanding incentive) | Daily deposit / reconciliation |
| **UPPCL** (direct) | Own collection-service onboarding (upcscbls) | % of collection (often capped) | Daily |
| **TANGEDCO/TNPDCL, BESCOM** | Reachable via BBPS (per-txn) and their own portals | Per-txn (BBPS) | T+1 (BBPS) |

Sources: NPCI BBPS guidelines; Setu/BillAvenue BBPS; mahadiscom; upcscbls onboarding.

**Takeaways that shaped the model:** commission models differ per DISCOM (flat vs %
vs current/arrears split), settlement differs (T+1 BBPS vs daily direct), and some
direct models need a **working-capital float/deposit**. So a license is configurable.

## Money model (system of record)

- **All money is integer paise** (`BigInt` in the DB; `number` paise in pure math,
  safe to ~₹9 lakh crore). Never floats. Commission floored, never rounds up.
- **`DiscomLicense`** — per-DISCOM config: `mode` (BBPS | DIRECT | MANUAL), `aggregator`,
  `status` (SANDBOX/ACTIVE), commission model (`PER_TXN` | `PERCENT` | `PERCENT_SPLIT`
  with current/arrears bps, cap, min), `settlementCycle`, `floatPaise`.
- **`Collection`** — a consumer payment: `amountPaise`, `method`, `isOutstanding`,
  derived `commissionPaise`, status (INITIATED → CONFIRMED → REMITTED → RECONCILED /
  FAILED / REFUNDED), and a unique **`(orgId, idempotencyKey)`** so retries never
  double-collect. Links to the `ElectricityBill` it settles (payments layer).
- **`Remittance`** — a settlement batch to the DISCOM: `grossPaise` collected,
  `remittedPaise` (gross to the DISCOM), `commissionPaise` (our earning), reconciliation.
- **Flow:** chase (worklist of unpaid/overdue bills) → collect (records a Collection,
  marks the bill paid) → remit (batch confirmed collections to the DISCOM; commission
  accrues to the license float) → reconcile.
- Commission math lives in `server/src/collections/money.ts` and is **invariant-tested
  in CI** (`scripts/collections-check.ts`, `npm run collections:check`).

## Endpoints (`/v1/collections`)
- `GET /summary` — collected / commission / pending-remit / remitted / float, by DISCOM
- `GET /licenses` — configured licenses
- `GET /worklist` — unpaid bills to chase (overdue first), matched to a license
- `POST /` — record a collection (idempotent)
- `POST /licenses/:id/remit` — settle confirmed collections to the DISCOM

## The connector seam (where real money plugs in)
`server/src/collections/connector.ts` is the money-movement boundary. Today a `mock`
connector records settlements without moving funds. A real rail registers here:
- **BBPS:** a BBPOU/AI aggregator (Setu / BillAvenue / Cashfree) API + sponsor bank.
- **DIRECT:** the DISCOM's agency API/portal + nodal/escrow account.
Gate behind `COLLECTIONS_LIVE` + per-aggregator credentials.

## Compliance reality (do not skip)
Code is the **system of record + connector seam**. It does **not** grant a license or
move money. To go live you need, per rail:
- BBPS **Agent-Institution/BBPOU** tie-up, **or** each DISCOM's signed **agency agreement**;
- a **sponsor / nodal / escrow bank** account and RBI **PA-PG / AI** standing;
- **KYC/AML**, settlement reconciliation (DSR), refund/chargeback handling, audit trail.
Until those exist, licenses stay `SANDBOX` and the `mock` connector is used.
