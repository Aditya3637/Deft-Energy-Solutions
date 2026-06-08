# Bill Analysis Engine — how the 58 checks work

This is the heart of the product: a consumer uploads a bill, the engine runs **all 58 loss checks**
(`lib/loss-taxonomy.ts`) and returns, per check, a ₹/year figure, "clear", or "needs more data".
Implementation: `lib/diagnosis.ts` (`fullDiagnose`). Result UI: the analyze flow result step.

## Two hard rules

1. **No false positives from missing OCR fields.** A field that fails to extract reads as `0`. Every
   detector guards on the fields it needs being present (`> 0`) before it can fire. A missing field must
   never look like a finding. (This was the main bug class fixed in the audit.)
2. **Honest buckets.** Results split into:
   - **Recoverable** — money leaking *now* (penalties, errors, inefficiency you can stop). This is the
     headline ("you're overpaying ~₹X/yr").
   - **Opportunities** — a switch/investment decision (open access, solar, BESS — categories 7 & 8).
     Shown separately as "bigger moves / potential", surfaced as progressive next steps.

## Assessable from a single bill (compute a ₹ figure or "clear")

Demand charge rate is read from the bill itself: `ratePerKva = fixedDemandCharges / billingDemandKva`
(fallback ₹450/kVA/mo). All annual figures are the monthly value × 12 (one bill = one month).

| Check | Fires when | Annual ₹ | Notes / guards |
| ----- | ---------- | -------- | -------------- |
| 1.1 Contract demand over-sized | `cd>0, md>0, md < 0.85·cd` | `(cd − rec)·rate·12`, `rec = ceil(md·1.15)` | Provisional — single month; note says "confirm with 12-month history" |
| 1.2 Demand exceeded contract | `cd>0, md>0, md > cd` | `(md − cd)·rate·1.75·12` | Penalty multiplier 1.75× |
| 1.3 Billed above actual demand | `md>0, bd>0, bd > md·1.05` | `(bd − md)·rate·12` | 5% tolerance avoids double-counting with 1.1 |
| 1.4 Low load factor | `0 < lf < 40` | `fixedCharges·12·0.15` | — |
| 2.1 PF penalty | `0 < pf < 0.95, penalty>0` | `penalty·12` | Reads the explicit penalty line |
| 2.2 kVAh inflation | no penalty line, `pf<0.95, kvah>kwh` | `(kvah − kwh)·(ec/kwh)·12` | Mutually exclusive with 2.1 |
| 2.3 Lost high-PF rebate | `pf ≥ 0.95, no penalty` | `fixedCharges·0.02·12` | Only when PF is already good |
| 3.1 Peak-hour shift | `peakKwh>0, peakRate>offRate>0` | `peakKwh·0.2·(peakRate−offRate)·12` | Shift ~20% of peak |
| 3.4 ToD not applied | all ToD slabs `= 0`, `ec>0, md>0` | `ec·0.05·12` | Positively no slabs (not just a missing field) |
| 5.2 Voltage/tariff mismatch | supply voltage vs tariff category disagree | `ec·0.07·12` | String check |
| 6.5 Arrears to review | `arrears > 0` | `arrears` (one-time) | Not annualised |
| 7.1 Open access *(opportunity)* | not on OA, `ec/kwh > 6.5`, `sanctionedLoad ≥ 100 kW` | `ec·0.12·12` | Rate keyed off energy charges, not total |
| 9.4 Late-payment surcharge | `latePayment > 0` | `latePayment·12` | — |
| 9.7 Minimum charges | (placeholder) | — | Needs tariff minimum to assess |

The remaining **44 checks** are returned as **"needs more data"**, each tagged with what unlocks it:
15-minute interval data, sub-metering, building profile, DG fuel bills, the DISCOM tariff order,
12-month history, a power-quality survey, open-access inputs, portfolio data, or metering records.
The result screen groups these into an "Unlock more savings" panel ("Add 15-minute data → +N checks").

## Funnel

Upload → instant ₹ diagnosis (recoverable headline) → recoverable list + bigger moves → "Unlock more"
data asks (15-min data, building profile for solar…) → "Talk to an advisor" conversion (managed
recovery / collection-agent portal). Each step is a progressively larger ask, exactly as intended.

## Honesty caveats (carried into Stage G)

- The ₹ coefficients (demand-penalty multipliers, OA net %, rebate %) are reasonable estimates. The real,
  DISCOM-specific values come from the tariff database at Stage G.
- Single-bill demand findings (1.1) are provisional until 12 months of data confirm the annual peak.
