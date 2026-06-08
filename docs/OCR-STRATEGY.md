# Bill ingestion & OCR strategy

## The honest starting point

**Today the platform does no real OCR.** `/analyze` runs on a fixed sample bill with a simulated
"extracting…" step, to build and validate the experience screens-first. Real ingestion is **Stage G**.
So zero confidence in "the OCR" right now is the correct stance — there is no OCR yet to judge.

OCR of Indian electricity bills is genuinely one of the hardest document-extraction problems there is:

- **75+ DISCOMs**, government and private, each with its own layout — and layouts change between tariff years.
- **No standard schema**: charge line-items, ToD slabs, surcharges and demand definitions differ by state.
- **Multi-script**: English plus 10+ regional languages on the same or different bills.
- **Quality**: digital PDFs, clean scans, phone photos, faded thermal prints, multi-page HT bills.
- **Traps**: CT/PT multiplying factors, kVAh-vs-kWh billing, "billing demand = max(MD, x% of CD)".

A single OCR model will not solve this. Anyone claiming a generic model reads all bills accurately is wrong.

## Principle: don't bet the product on OCR

Reliability comes from the **architecture**, not from one model. OCR is the *fallback*, used only when no
better channel exists.

### 1. Prefer structured channels over pixels (remove consumers from the OCR problem entirely)

- **Digital PDF text layer** — a large share of C&I / HT bills are issued as digital PDFs with a selectable
  text layer. Parse the text directly: near-100%, no OCR. This is the first thing to try on every upload.
- **BBPS / Bharat Connect** — the bill-payment rails return *structured* biller data (consumer name, bill
  number, amount due, due date) for electricity billers. This is accurate and free of OCR — but note it is
  a **summary**, not the rich determinants (it won't give MD, PF, kVAh, ToD breakdown). Good for identity +
  amount + due-date checks and to cross-validate an OCR read.
- **DISCOM consumer-portal fetch** — with the consumer's number/credentials, pull the bill or its data
  directly (portal API where available, else authenticated scraping).
- **Smart meter / AMI (DLMS/COSEM via HES/MDMS)** — for connected sites the billing determinants and 15-min
  data come from the meter-data infrastructure, not the paper bill.

Each channel takes a slice of consumers off the OCR path. OCR handles only what's left: a photo/scan with no
digital source.

### 2. Hybrid extraction for the image/scan path (current best practice, 2026)

1. **Pre-process** — detect digital-vs-scanned; for scans, deskew / dewarp / denoise / binarise;
   split multi-page HT bills.
2. **Vision-language model with a constrained schema** — modern multimodal models (Claude / Gemini /
   GPT-4o-class vision, or fine-tuned open VLMs such as Qwen2-VL / InternVL, and layout models like
   LayoutLMv3 / Donut) read heterogeneous layouts far better than template OCR. They emit the 42-field
   JSON via schema/tool-forced output, with **per-field confidence**, and handle regional scripts.
3. **Per-DISCOM template / anchor extractors for the top formats** — the 80/20: ~15–20 DISCOMs cover most
   C&I volume. Once a format is seen, a deterministic anchored extractor (label-relative positions, regex
   around known field labels) beats the generic model and is cheap. The VLM covers the long tail.
4. **Ensemble + reconcile** — run text-layer + VLM (+ template) and reconcile; disagreement lowers
   confidence and routes to review.

### 3. Validation layer — this is where reliability actually comes from

Extraction is not trusted until the numbers reconcile. These cross-checks catch and often *repair* misreads,
and flag the rest as low-confidence:

- `(current − previous reading) × multiplying factor ≈ recorded consumption`
- `energy + fixed + FAC + duty + surcharges − rebates + arrears ≈ total payable`
- `kVAh ≥ kWh`, `PF ≈ kWh / kVAh`, `0 < PF ≤ 1`
- `MD ≤ CD` (typically); `billing demand = max(MD, x% of CD)`
- consumption sane vs sanctioned load × billing days; month-over-month continuity for repeat consumers.

A field that fails its cross-check is corrected (when another field implies it) or marked for review.

### 4. Human-in-the-loop — by design, not as a patch

The **"review & correct the 42 fields" screen we already built is the reliability backstop** that serious
players rely on. Low-confidence fields are highlighted; the user confirms in seconds. Critically, the
**analysis engine is built to produce an honest result from partial data** — it runs on whatever fields are
present and flags the rest as "needs data" (see [BILL-ENGINE.md](./BILL-ENGINE.md)). A 70%-confident
extraction still yields a useful, non-misleading result instead of a wrong one.

### 5. Feedback loop

Every human correction is labelled training data, keyed to DISCOM + format. Per-DISCOM accuracy compounds
over time, and the confidence threshold for auto-accept (no human review) rises as the corpus grows.

## How we prove it — measurement, not claims

- Build a **labelled gold corpus** per DISCOM (start with the top ~20 by C&I volume), tiered by quality
  (digital PDF / clean scan / photo / faded).
- Track **field-level accuracy + confidence** per DISCOM per tier, and end-to-end **"% of bills
  auto-processed without a human edit."**
- The accuracy targets in [SPEC_V2.md](./SPEC_V2.md) §7 (HT 98%+, LT 95%+, regional 90%+, photos 85%+) are
  **targets to earn against this corpus** — not current numbers. We report measured accuracy, never a
  marketing figure.

## What is and isn't defensible *today*

- **Not defensible:** "our OCR reads any bill." There is no OCR yet; the demo is simulated.
- **Defensible:** the *system design* — multi-channel intake so most consumers never hit OCR; a
  validation + human-in-the-loop + feedback architecture that is how reliable extraction is actually
  achieved; and an analysis engine already hardened to give honest results from imperfect/partial data.

## De-risking sequence (Stage G)

1. **Digital-PDF text parser + arithmetic validation** — highest accuracy, lowest effort; covers
   digital-PDF consumers first.
2. **BBPS / portal fetch** for structured summary data and cross-validation.
3. **VLM schema extraction** for photo/scan uploads, behind the existing review/correct UI, capturing
   corrections as training data.
4. **Per-DISCOM templates** for the top ~20, prioritised by real volume.
5. **Live accuracy dashboard** (SPEC_V2 §7 matrix wired to the gold corpus) — so accuracy is a measured,
   visible number, per DISCOM, not a claim.
