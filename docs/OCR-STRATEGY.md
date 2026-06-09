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

1. **Digital-PDF text parser + arithmetic validation** ✅ *done* — `pdf-parse` reads the text layer
   locally (no API/vision), then a cheap text model structures it into the 42 fields; the arithmetic
   sanity checks validate the result. Covers digital-PDF consumers first, and is the genuinely-free PDF
   path on the `openai`/Llama provider (which otherwise takes images only). Scanned PDFs (no text layer)
   fall back to the vision path.
2. **BBPS / portal fetch** for structured summary data and cross-validation ✅ *scaffolded* —
   `server/src/billfetch/`: `GET /v1/billfetch/billers` (DISCOM catalog) + `POST /v1/billfetch` (fetch a
   summary by consumer number). Provider seam: `mock` (built-in demo summary, default) or `bbps` (a
   generic, env-configured aggregator adapter — Setu/Cashfree/Razorpay/Decentro/etc.; BBPS is NPCI-run
   with no free public API). Returns summary fields into the same review screen; full diagnosis still
   needs the detailed bill. Real biller IDs per DISCOM are filled from the aggregator's directory.
3. **VLM schema extraction** for photo/scan uploads ✅ *done* (Stage G) — behind the existing
   review/correct UI; **corrections now captured** (`POST /v1/corrections` logs model value + confidence
   vs the user's final value, per field) as training data.
4. **Per-DISCOM templates** for the top ~20, prioritised by real volume.
5. **Live accuracy dashboard** ✅ *done* — `/app/accuracy` reads `GET /v1/corrections/accuracy` and shows
   overall / per-DISCOM / per-field accuracy (colour-banded bars, hardest fields first). Live on Vercel
   SSR; the static demo bakes a fixture. Accuracy is now a measured, visible number per DISCOM, not a
   claim — and it rises as users review bills.

## Extraction providers & cost (Stage G — implemented)

`POST /v1/extract` is provider-agnostic. `EXTRACT_PROVIDER` selects the backend; the request shape, the
42-field contract, the confidence scoring and the review/correct UI are identical across providers.

| Provider (`EXTRACT_PROVIDER`) | Hosts | Input | Cost | Use for |
|---|---|---|---|---|
| `anthropic` (default) | Claude vision | **PDF + images** | Paid (Opus ~$5/1M in; Haiku ~5× cheaper) | Production accuracy; scanned/digital PDFs |
| `openai` | Groq · Meta Llama API · OpenRouter · Together · Gemini-compat · **Ollama (self-host)** | **Images only** | Free tier / self-host $0-per-call | Dev, low volume, cost-sensitive |

### The honest "free" picture
There is **no vision API that is truly free at ~50,000 bills/month** — every free tier is rate-limited and
meant for development or low volume:

- **Groq** (Llama 4 Scout/Maverick vision) — generous free tier, very fast; best free dev option.
- **Meta Llama API** (Llama 4, OpenAI-compatible) — free developer preview; limits will tighten at GA.
- **OpenRouter** `:free` Llama vision variants — genuinely $0 but tight rate limits, variable uptime.
- **Google Gemini Flash** — free tier (~1,500 req/day) with strong OCR; **paid Flash is the cheapest
  *reliable* option at scale** (well below Claude).

For genuine $0-per-call at volume, **self-host**:
- **Ollama / vLLM running Llama 3.2-Vision or Llama 4** — no API fee, but needs a GPU (real infra cost).
- **Tesseract / PaddleOCR / Surya** (open-source OCR) — free, but text-only; needs a parser/LLM layer to
  reach the structured 42 fields, and struggle on complex/scanned Indian bill layouts.

### Recommendation
- **Dev / pilot:** `openai` + Groq (Llama 4) or Gemini Flash free tier — $0, image uploads.
- **Production at lowest cost:** `anthropic` with `EXTRACT_MODEL=claude-haiku-4-5`, **or** Gemini Flash
  (paid), **or** self-hosted Llama-Vision once volume justifies a GPU.
- **Production at best accuracy:** `anthropic` default (Opus), reserving the free path for overflow/dev.

Free OpenAI-compatible hosts can't OCR a PDF *image* (no server-side rasteriser is bundled — that needs
a native dep), so a **scanned** PDF on the free path still needs a photo/screenshot or the `anthropic`
provider. But most DISCOM-portal PDFs are born-digital with a text layer: the **digital-PDF text-parse
path** (de-risking step 1, now implemented) reads that text locally and structures it via a cheap text
model — so digital PDFs work on the free `openai`/Llama provider too, at minimal cost.
