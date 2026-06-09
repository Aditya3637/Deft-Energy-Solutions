# Deft Energy Solutions — Progress Log (LIVING)

> Updated every working session. Newest entry on top. See [PLAN.md](./PLAN.md) for stages & DoD.

## Current state

- **Approach:** SCREENS FIRST (UI + mock-API seam fully built and polished, then backend → endpoints → integrations)
- **Active stage:** Frontend ✅ · backend **LIVE on Render** ✅ · Stage F (analyze save) live ✅ · Vercel-ready ✅ · **Stage G real OCR (code-complete)** ⏳ key · **Payments/due-date tracking** ✅ · **Collection-agent backend (sandbox)** ✅

### 2026-06-09 (G7.5 — BBPS aggregator connector wired, env-gated)
- **Implemented the real `bbps` connector** (`server/src/collections/connector-bbps.ts`) against the Setu
  Bharat Connect shape: OAuth client-credentials token (cached), async **fetch/pay (request → poll
  response)**, amounts in **paise**, tolerant status/ref parsing (works across Setu/Cashfree/BillAvenue
  shapes with env tweaks). Never throws — returns FAILED so the caller records the attempt.
- **Wired into `collections.create()`:** for **BBPS-mode** licenses the payment is moved on the rail via
  `payBill` *before* persisting; status maps SUCCESS→CONFIRMED / PENDING→INITIATED / FAILED, and the bill
  is settled (payments layer) only when CONFIRMED. **Idempotent at the rail** (our `idempotencyKey` is the
  txn reference, so a retry can't double-pay) and in the DB (unique `(orgId, idempotencyKey)`, P2002 race
  handled). Connector call is outside the DB txn.
- **Gated by `COLLECTIONS_LIVE` + `BBPS_*` secrets** (`selectConnector`); defaults to `mock`, so nothing
  changes until real sandbox creds are set. Env documented in `.env.example` + `render.yaml` (sync:false).
- **Honest:** not yet run against a live sandbox from here — that needs the agent onboarding + UAT creds,
  and the exact endpoints/field names must be confirmed at certification (PLAN §7 G7.4). PLAN G7.5 marked
  in-progress (connector built ✓).

### 2026-06-09 (Plan review — added the BBPS-licence / real-money go-live track)
- **Reviewed PLAN.md vs reality.** Stages A–F effectively complete; Stage G in progress: extraction
  (code-complete, needs key), BBPS-fetch scaffold, payments ✅, collection-agent backend ✅ (sandbox).
- **Added PLAN §7 — "Collection-agent go-live — the BBPS licence track (REAL MONEY)."** It sequences the
  *regulated* path (not a code task): become an **Agent Institution under a BBPOU** (fast path) vs.
  **become a BBPOU ourselves** (the literal "take the licence" — ~₹25cr net-worth/RBI, slow) vs.
  **DISCOM-direct agency agreements**; then entity/KYC → sign BBPOU/DISCOM → escrow/sponsor bank →
  NPCI/BBPOU certification + real biller IDs → **connect the code (the seam is already built; set
  `COLLECTIONS_LIVE`, flip licences SANDBOX→ACTIVE) + settlement reconciliation** → operate. Stage G
  updated to mark what's built and point at §7.

### 2026-06-09 (Collection-agent backend — money-safe, multi-DISCOM)
- **Researched** how DISCOM collection agents work (BBPS Agent-Institution per-txn + T+1 NPCI;
  MSEDCL %-split current/arrears; UPPCL direct onboarding; BESCOM/TANGEDCO via BBPS) → `docs/COLLECTION-AGENT.md`.
- **Model (`server/src/collections/` + 3 tables):** `DiscomLicense` (mode BBPS/DIRECT/MANUAL, configurable
  commission PER_TXN / PERCENT / PERCENT_SPLIT with cap/min, settlement cycle, float), `Collection`
  (idempotent via unique `(orgId, idempotencyKey)`, explicit state machine, links to the bill it settles),
  `Remittance` (gross → remitted → commission batch). **All money is integer paise (BigInt) — no floats.**
- **Flow:** worklist (unpaid/overdue bills, matched to a license) → record collection (computes commission,
  marks the bill paid on the payments layer) → remit batch to the DISCOM (commission accrues to float).
- **Money-safety locked in CI:** `scripts/collections-check.ts` asserts commission invariants (percent,
  per-txn clamp, cap, current/arrears split, floor-never-round-up, ≤ amount). Runs in Server CI.
- **Connector seam** (`connector.ts`): `mock` today; real BBPS aggregator / DISCOM API plugs in behind
  `COLLECTIONS_LIVE`. **Honest:** code is the system-of-record; real money needs the license + sponsor bank
  + KYC (documented). Licenses seeded SANDBOX/ACTIVE for 4 DISCOMs + sample collections + one remittance.
- **Frontend `/app/collections`:** collected / commission / pending-remit / float StatCards, per-DISCOM
  license cards, and a client **collection worklist** (Collect → settles the bill). Sandbox banner. Nav entry.

### 2026-06-09 (Payments & due-date tracking — multi-asset)
- **New `/app/payments` view: every asset's bills, due dates and payment status in one place.**
  StatCards (Outstanding ₹, Overdue count+₹, Due-in-7-days, Paid-on-time %) + a sortable table
  (overdue first) with a **Mark paid / Undo** action per bill.
- **Model:** `ElectricityBill` gained `dueOn` (parsed from the extracted DD-MM-YYYY due date at create),
  `paidAt`, `paidAmount` (+ `@@index([dueOn])`). Payment **status is DERIVED, never stored** —
  PAID_ON_TIME / PAID_LATE / OVERDUE / DUE_SOON / UPCOMING — so it can't go stale.
- **Backend** `server/src/payments/`: `GET /v1/payments/summary` (portfolio totals), `GET /v1/payments`
  (tracked bills + derived status, urgency-sorted), `POST /v1/payments/:id/pay` and `/unpay`. RLS-scoped.
  `bills.service` now parses the due date into `dueOn` on every saved bill (`bills/due-date.util.ts`).
- **Seed:** ~36 bills across the 6 buildings with due dates relative to *now* (recompute each deploy) in
  mixed states, so the live view is populated and demoable.
- **Frontend:** `lib/api/payments.ts` seam (live on Vercel SSR, fixture on static Pages) +
  `components/app/payments-table.tsx` (optimistic mark-paid) + nav entry. Status on-time/late judged
  against the due date.
- **Note:** bills are now true payment *obligations*, not just extraction records — the foundation the
  collection-agent backend will sit on next.

### 2026-06-09 (Audit — diagnosis-engine correctness for high-stakes use)
- **Audited the extract→confirm→diagnose→display chain and fixed real false-positive bugs** in BOTH
  engines (lib/diagnosis.ts + server/src/diagnosis/engine.ts, kept byte-identical):
  - **1.3 billing-demand floor:** no longer flags legitimate tariff-floor billing demand (≈75% of contract
    demand when recorded MD is lower) as an over-billing loss. Now fires only when billing demand exceeds
    both recorded MD *and* the floor; needs contract demand to judge (else stays healthy).
  - **6.5 arrears:** arrears are money OWED, not a saving — now flagged for review but contribute ₹0 to
    the recoverable headline (were being summed in as "savings").
  - **3.4 ToD-not-applied:** gated on ToD eligibility (HT supply or ≥100 kW) so LT/small consumers aren't
    falsely told they're losing money.
  - **Power-factor robustness:** new `pf01()` tolerates PF entered as a percentage (96 → 0.96), preventing
    2.1/2.2/2.3 mis-fires; 2.3 reworded to "verify if not already credited."
  - **Provisional notes** on 1.1/1.2 (single-month → confirm with 12-month history).
- **Locked it in CI:** `server/scripts/diagnosis-check.ts` asserts the no-false-positive invariants
  (floor, arrears, ToD eligibility, PF%, clean-bill = ₹0) and runs in Server CI (`npm run diagnosis:check`).
- **Honest posture:** OCR of arbitrary bills is never 100% — that's why every field is human-confirmed +
  arithmetic-checked before it drives the engine, and the engine itself is conservative + now invariant-
  tested. The Acme sample headline is unchanged by these fixes (verified: its fields don't trip them).
- **Found (NOT yet built):** real multi-asset *payment/due-date tracking* (bills are extraction records,
  no paid/overdue status) and a real *collection-agent backend* (the /field/collection route is a mock UI;
  no payments/persistence). Gap analysis captured; proposed as next builds.

### 2026-06-09 (Stage G⁷ — template effectiveness: with/without accuracy)
- **`templateApplied` now recorded on every feedback row** (schema + DTO + capture) so the accuracy view
  can prove whether per-DISCOM templates actually help. `GET /v1/corrections/accuracy` now returns
  with-template vs without `templated`/`untemplated` buckets — overall and per DISCOM (accuracy + sample
  counts). Schema column added with a `""` default (safe `prisma db push`).
- **Dashboard:** new "Do per-DISCOM templates help?" card (with vs without bars + overall lift in pts),
  and each DISCOM row now shows a `template X% (n) · without Y% (m) · +Δ pts` footer where both exist.
  Fixture updated so the static demo shows the comparison. Closes the prove-it loop on Stage G⁶.

### 2026-06-09 (Stage G⁶ — per-DISCOM template hooks)
- **Targeted, per-utility extraction cues** (`server/src/extract/discom-templates.ts`). When the DISCOM is
  known, that utility's hints for the hardest fields (MD date/time, billing demand, meter no., PF penalty,
  FAC, ToD zones) are injected into the **user** message (cached system prefix stays byte-stable).
- **DISCOM resolution:** explicit hint — optional "Electricity board" picker on the upload screen, or the
  BBPS biller — else **auto-detected** from the PDF text layer (scans for MSEDCL/BESCOM/… signatures).
  Threaded through both providers (`extractViaAnthropic[Text]` / `extractViaOpenAI[Text]`) and the
  service; `POST /v1/extract` takes an optional `discom` field; result reports `templateApplied`.
- Seed templates: MSEDCL, BESCOM, TANGEDCO, TPDDL, BSES, Adani, Torrent. The accuracy dashboard's
  "hardest fields per DISCOM" is the worklist for adding/refining more. Closes de-risking step 4.

### 2026-06-09 (Stage G⁵ — accuracy dashboard UI)
- **`/app/accuracy` — measured extraction accuracy, per DISCOM and per field.** Server page reads
  `corrections.accuracy()` (live on Vercel SSR via `GET /v1/corrections/accuracy`; the static Pages build
  bakes a labelled fixture). Shows: overall accuracy + reviewed-bills/fields/corrections StatCards;
  "Accuracy by DISCOM" (where templates are needed, sorted by volume); "Hardest fields" (most-corrected
  first — the prompt-tuning/template priority list), each a colour-banded bar (<85% red, <95% amber,
  ≥95% green). Empty state when no reviews yet. Added to the sidebar nav (Gauge icon). Field labels via a
  shared `fieldLabel` helper in the api layer. Closes de-risking step 5 — accuracy is now a visible,
  measured number that rises as users review bills, not a marketing claim.

### 2026-06-09 (Stage G⁴ — corrections-capture loop)
- **Every reviewed extraction is now logged as training data + an accuracy signal.** When the user moves
  from review → result, the frontend diffs the model's original values+confidence against the final
  values and POSTs them (fire-and-forget, non-blocking, skipped for the sample bill).
- **Backend** `server/src/corrections/`: `POST /v1/corrections` writes an `ExtractionFeedback` row
  (provider, model, source, discom, fieldsFound/Total, correctedCount, and per-field
  `{extracted, extractedConfidence, final, corrected}` JSON) via RLS-scoped `withOrg`.
  `GET /v1/corrections/accuracy` aggregates the recent window into overall / per-DISCOM / per-field
  accuracy (= 1 − corrections/seen) — the data source for the accuracy dashboard (de-risking step 5).
- **Schema:** new `ExtractionFeedback` model + RLS policy (`prisma db push` + `rls.sql` apply on boot).
  Shared `mergeRawFields`/field model reused so all three intake channels feed one capture path.
- **Frontend:** `lib/api/corrections.ts` (`submit` + `accuracy`); analyze-flow snapshots the pristine
  extraction (provider/model/source/DISCOM) and emits the diff on continue. No new env.

### 2026-06-09 (Stage G+++ — BBPS / DISCOM-portal fetch scaffold)
- **New intake channel: fetch a bill by consumer number** (no upload). `server/src/billfetch/`:
  `GET /v1/billfetch/billers` (DISCOM catalog — 15 majors with required params) + `POST /v1/billfetch`.
  Provider seam (`BILLFETCH_PROVIDER`): `mock` (built-in demo summary, default — works on the live
  backend with no account) or `bbps` (generic env-configured aggregator adapter; BBPS is NPCI-run with
  no free public API — go through Setu/Cashfree/Razorpay/Decentro/etc.). Returns BBPS summary fields
  (amount, due date, name, energy) merged into the same 42-row review screen via the shared
  `mergeRawFields` (factored out of the extract service into `extract/fields.ts`).
- **Frontend:** `lib/api/billfetch.ts` + a `FetchPanel` on `/analyze` (DISCOM select + consumer-number
  input → fetch → review). Honest UI note: demo vs live, and "BBPS returns a summary; upload the full
  bill for the 58-check diagnosis."
- **Honest framing:** BBPS fetch is a *summary* channel (validation + collections), not full extraction;
  and there's no free public BBPS API — real fetch needs a paid aggregator account + biller IDs.
  Docs: `.env.example`, `render.yaml` (`BILLFETCH_PROVIDER=mock`), OCR-STRATEGY de-risking step 2.

### 2026-06-09 (Stage G++ — digital-PDF text-parse path)
- **Free path for born-digital PDFs.** `server/src/extract/pdf-text.ts` reads the PDF text layer locally
  with `pdf-parse` (pure JS, no native deps, no API). If the layer is usable (`hasUsableText`: ≥120
  non-space chars + digits), the service structures the **text** via the configured provider's new text
  path (`extractBillText`) instead of vision — far cheaper, and the only PDF route the free `openai`/Llama
  provider has (it otherwise takes images only).
- **Routing** (`extract.service.ts`): PDF → try text layer → structure text (`source:"pdf-text"`); scanned
  PDF (no text) or image → vision (`source:"vision"`). If a text parse yields < 6 fields and the provider
  can do vision (Anthropic), it falls back to OCR-ing the PDF. Providers refactored to share one call with
  two entry points (vision + text): `extractViaAnthropicText` / `extractViaOpenAIText`.
- **UI:** when a bill is read from the text layer, the review screen notes "Read directly from the PDF's
  text layer — no OCR needed." `pdf-parse` added to server deps; typed via `src/types/pdf-parse.d.ts`
  (inner-module import sidesteps its debug harness). Marks de-risking step 1 done (`docs/OCR-STRATEGY.md`).

### 2026-06-09 (Stage G+ — sanity checks + pluggable providers)
- **Arithmetic sanity-check pass on the review screen** (`lib/bill-checks.ts` → `SanityChecks` card).
  Re-runs live as the user edits. No-false-positive discipline: each check fires only when its inputs are
  present and on a physical impossibility or large discrepancy. Checks: charge lines vs total (warns only
  when parts exceed the whole), apparent ≥ active energy, PF range + PF vs kWh/kVAh, ToD zones vs total,
  recorded vs contract demand (exceedance info), due-date ≥ bill-date, billing-period plausibility.
- **Extraction is now provider-agnostic** (`EXTRACT_PROVIDER`): `anthropic` (default, PDF+images, paid,
  most accurate) or `openai` (any OpenAI-compatible host — Llama via Groq / Meta Llama API / OpenRouter /
  Together, Gemini-compat, or self-hosted Ollama; images only; free/low-cost tiers). Refactored into
  `extract-core.ts` (shared prompt/schema/parse/retry) + `provider-anthropic.ts` + `provider-openai.ts`
  + `provider.ts` dispatcher. Same 42-field contract + confidence + review UI across all providers.
- **Honest cost note:** no vision API is truly free at 50k bills/mo — free tiers are dev/low-volume.
  Cheapest reliable at scale = Gemini Flash (paid) or Haiku; genuine $0/call = self-hosted Llama-Vision
  (GPU). Documented in `docs/OCR-STRATEGY.md` (providers & cost table).

### 2026-06-09 (Stage G — real bill extraction)
- **Replaced the simulated upload with real vision OCR.** New backend module `server/src/extract/`:
  - `POST /v1/extract` — multipart upload (field `file`, ≤25 MB; PDF / JPEG / PNG / WebP).
  - Sends the bill to the Anthropic Messages API (raw `fetch`, no SDK) as a base64 `document` (PDF) or
    `image` block — handles clean digital PDFs **and** scanned/photo bills via the model's vision.
  - **Structured output via forced tool use** (`emit_bill_fields`): the 42 canonical keys are an enum; the
    model returns only the fields it can actually read, each with a 0–1 **confidence**. No-false-positive
    by construction — omission is meaningful, nothing is inferred/derived.
  - Prompt-caches the stable prefix (tool schema + system + field reference); the per-bill PDF sits after
    the breakpoint so it never invalidates the cache.
  - Service merges hits into the full 42-row `ExtractedField[]` (key/label/group/unit/value/confidence),
    flags <0.8 confidence, returns `{fields, model, found, total, lowConfidence}`.
  - Model is env-configurable (`EXTRACT_MODEL`, default `claude-opus-4-8`; set `claude-haiku-4-5` for
    ~5× cheaper at volume). Needs `ANTHROPIC_API_KEY` — without it the endpoint 503s.
- **Frontend wired to the real endpoint.** `/analyze` now uploads the chosen file → `lib/api/extract.ts`
  → `POST /v1/extract`, feeding the existing review/correct screen. Graceful fallback to the sample bill
  when no backend is configured or extraction fails (with an honest banner). Review header now shows
  "read N of 42", flags low-confidence and not-found fields for the user to confirm.
- **Deploy:** added `ANTHROPIC_API_KEY` (`sync:false`) + `EXTRACT_MODEL` to `render.yaml` and
  `.env.example`. **Remaining to go live: set `ANTHROPIC_API_KEY` in the Render dashboard.**
- **Why this is the real thing now:** earlier the upload ignored the file and returned the Acme sample
  (so both the fields and the ₹ evaluation were sample-based). It now reads the uploaded bill.
- **Backend is live:** `https://deft-energy-server.onrender.com` (Render free tier — sleeps when idle; free
  Postgres `deft-postgres`/oregon expires ~90 days). Verified: `/v1/health` 200, RLS-scoped `/v1/buildings`,
  `POST /v1/bills` persists + auto-runs the 58-check engine (matches the frontend). Fixed an RLS bug on the
  way (`current_org()` must return `text`, not `uuid`, since Prisma `String @id` is `text`).
- **Stage F live:** the Pages frontend has `NEXT_PUBLIC_API_URL` set, so `/analyze` → "Save to workspace"
  persists a real diagnosed bill to the live DB. (Demo stays fixtures when the var is unset.)
- **Vercel-ready:** `next.config.mjs` is environment-aware — Pages stays static export under the repo
  basePath; a **Vercel** build (sets `process.env.VERCEL`) runs SSR at root so server pages can fetch live.
  `.vercelignore` keeps `server/` out of the Vercel build.
- **Next (live dashboard):** backend **data parity** — enrich Building (12-mo trend), add recent-bills /
  tasks / alerts endpoints + seed — THEN deploy the frontend to Vercel and switch `api.*` server pages to
  live fetch. Vercel deploy itself needs the repo connected to Vercel (or a Vercel token).
- **Workspaces:** frontend (root, → Pages) and **backend (`server/`, NestJS + Prisma + Postgres)** — separate.
  Server CI compile- AND Docker-build-verifies the backend. **Deploy:** `render.yaml` blueprint (managed
  Postgres, auto-deploy) or `docker compose up --build` locally. Final "go live" = connect the repo to
  Render (a hosting account I can't create) — everything else is wired.
- **Hosting:** GitHub Actions → static export → GitHub Pages. The build runs on GitHub's runners (so it
  also verifies the code compiles, since this laptop has no Node). Live URL:
  https://aditya3637.github.io/Deft-Energy-Solutions/
- **The seam:** `lib/api/*` exposes async, typed data functions (`api.portfolio.buildings()`, etc.),
  fixtures today; Stage F swaps the bodies to real endpoints behind identical signatures. Server pages
  `await` them; client components receive initial data as props from their server wrappers. **No screen
  imports `lib/mock/*` directly** — only the api layer does. Pure logic (diagnosis, ROI, formatting) stays
  in lib/* (runs client-side regardless of backend).
- **Next action:** **Stage E** — start the real backend (NestJS + 61-table PostgreSQL schema with RLS),
  which the seam is set up to receive → F (wire endpoints) → G (integrations + real OCR) → H (security/perf/
  testing). (OCR remains Stage G, clearly simulated.)
- **Routes live (app):** `/app` · `/app/executive` · `/app/bills` · `/app/buildings` + `[id]` ·
  `/app/payments` · `/app/tasks` · `/app/alerts` · `/app/analytics` · `/app/accuracy` · `/app/roi` · `/app/capex` · `/app/compliance` ·
  `/app/carbon` · `/app/markets` · `/app/assets` · `/app/marketplace` · `/app/training` ·
  `/app/leaderboard` · `/app/settings`
- **Routes live (field, mobile):** `/field` · `/field/work-orders` + `[id]` · `/field/audit` ·
  `/field/collection`
- **Routes live (public):** `/` · `/analyze` · `/pricing` · `/roi-calculator` · `/developers` · `/status` ·
  `/privacy` · `/terms` · `/login` · `/styleguide`

## Open questions / assumptions

- **OCR is NOT built — `/analyze` is simulated on a sample bill.** Real ingestion is Stage G. The strategy
  (multi-channel intake so most consumers skip OCR: digital-PDF text parse, BBPS, DISCOM portal, AMI; then
  VLM + per-DISCOM templates; validation + human-in-the-loop + feedback) is documented in
  [OCR-STRATEGY.md](./OCR-STRATEGY.md). The review/correct-42-fields screen and the engine's missing-field
  guards are the deliberate design for imperfect OCR. SPEC_V2 §7 accuracy numbers are targets, not current.
- **Tailwind v3, not v4.** SPEC_V1 mentioned "Tailwind CSS 4"; chose v3 + classic config for robustness
  when hand-authoring without a local build. Revisit if v4 is required.
- **No web fonts yet.** System font stack via `--font-sans` to avoid build-time font fetching; swap in a
  brand font (e.g. Inter via next/font) later.
- **Charts are dependency-free** (hand-rolled `BarChart`) for now; swap to ECharts/Recharts (per SPEC_V2)
  later without changing callers.
- Marketing CTAs `/pricing`, `/privacy`, `/terms` are later-stage routes — currently a graceful 404.

## Log

### 2026-06-09 (Backend parity — tasks + alerts)
- Backend: `tasks` module (`GET /v1/tasks`) and `alerts` module (`GET /v1/alerts`, `/v1/alerts/rules`),
  RLS-scoped. Seed upserts the 9 demo tasks, 6 alert rules, 6 alert instances (matching the fixtures;
  enum-cased; alert `triggered` as real dates).
- Frontend: `api.tasks.list` / `api.alerts.{list,rules}` live-fetch on Vercel SSR (shared `liveServer()` +
  `NO_STORE` in client.ts), mapping server enum casing → frontend lowercase/Title strings and ISO →
  DD-MM-YYYY; fixtures fallback. The Tasks/Alerts server pages already pass this to their client components,
  so the Kanban/alerts views render live on Vercel with no edit. Reads only (mutations stay client-local).

### 2026-06-09 (Frontend portfolio live-fetch)
- `lib/api/portfolio.*` now fetch the live backend when rendering **server-side on Vercel**
  (`process.env.VERCEL` + API configured), mapping the server Building shape → frontend Building; otherwise
  fixtures. GitHub Pages static build has no `VERCEL`, so it keeps baking fixtures — unchanged & green.
  Live fetches use `cache: "no-store"` and **fall back to fixtures** if the backend is unreachable.
- So: connect the frontend to Vercel (env `NEXT_PUBLIC_API_URL`) and the dashboard / buildings / analytics /
  bills pages render live data per request; the Pages demo is untouched.

### 2026-06-09 (Backend parity — portfolio domain)
- **Building** model gains `trendL Float[]`, `billsReceived`, `billsExpected` (matches the frontend shape).
  **Seed** upserts all **6** demo buildings by stable slug id (links match the frontend), backfills the new
  columns, prunes legacy rows from the first deploy, keeps one sample bill.
- New **portfolio** module: `GET /v1/portfolio/{totals,monthly,forecast,recent-bills}` — server ports of the
  frontend aggregate derivations, so the live dashboard matches the demo. RLS-scoped.
- Push auto-redeploys Render (db push adds columns, seed refreshes). Next: switch the frontend
  `api.portfolio.*` server pages to live-fetch (gated to Vercel SSR), then deploy to Vercel.

### 2026-06-09 (Backend LIVE on Render + Vercel-ready)
- Deployed the backend via the Render API: found the failing deploy (`update_failed`), diagnosed it from
  logs (RLS `text = uuid`), fixed `current_org()` to return `text`, redeployed → **live**.
  `https://deft-energy-server.onrender.com`. Verified health, RLS-scoped buildings, and a real diagnosed
  bill via `POST /v1/bills`. Set the Pages repo var `NEXT_PUBLIC_API_URL` + redeployed → analyze "Save to
  workspace" is live. (Render API key was used then **revoked** by the user.)
- Made `next.config.mjs` environment-aware (Pages static export ↔ Vercel SSR) + `.vercelignore`. Pages
  build unchanged/green. Sets the stage for a live dashboard once the backend reaches data parity.

### 2026-06-09 (Stage F — wire the seam to the live backend)
- `lib/api/client.ts` — `getApiBase()`/`isApiConfigured()`/`apiFetch()` reading `NEXT_PUBLIC_API_URL`
  (sends the demo `x-org-id`).
- `lib/api/bills.ts` — `bills.create(fields)`: POST /v1/bills when configured (maps the 42 editable fields
  to the server DTO), else a demo no-op. Same signature both ways.
- `/analyze` result gets a **"Save to workspace"** button → live persist + server diagnosis (toast feedback).
- `.env.example` (frontend); Pages deploy build embeds `vars.NEXT_PUBLIC_API_URL` so setting that repo
  variable + redeploy flips the live path on.
- Static-export reality documented: only client-side actions can go live on Pages; server-component pages
  stay build-time fixtures until parity / a non-static host.

### 2026-06-09 (Stage E — deploy setup)
- **Dockerised** the backend (`server/Dockerfile`, multi-stage). On boot the container runs `prisma db push`
  → applies RLS → seeds (idempotent) → serves.
- **`render.yaml`** blueprint: managed Postgres + the web service from the repo, `DATABASE_URL` injected,
  health check `/v1/health`, auto-deploy. **`docker-compose.yml`** for one-command local runs.
- **RLS hardened** with `FORCE ROW LEVEL SECURITY` (real isolation even with a single owner role on managed
  Postgres). Moved the seed to `src/seed.ts` — RLS-aware (sets `app.current_org` in a transaction) and
  idempotent — so it compiles to `dist/seed.js` and runs on boot; `main` binds `0.0.0.0`.
- **Server CI** now also `docker build`s the image, verifying the deploy artifact.
- Honest limit: I can't create a Render account or run Docker here, so I can't click "go live". Everything
  is wired; connecting the repo to Render (or `docker compose up`) makes it run.

### 2026-06-09 (Stage E — diagnosis engine ported + persisted)
- Ported the **58-check diagnosis engine** server-side (`server/src/diagnosis/` — loss-taxonomy + engine,
  faithful to the frontend, self-contained ExtractedField type).
- New `diagnosis` module: `POST /v1/diagnosis` (stateless, mirrors the frontend) and
  `POST /v1/bills/:id/diagnose` (persists). **Creating a bill auto-runs the engine** and stores a
  `Diagnosis` (recoverable/opportunity ₹) + one `LossFinding` per detected loss; re-runnable.
- `billToFields()` projects the 42 persisted columns into the engine's `ExtractedField[]`; renamed the
  `crossSubsidySurcharge` column so keys map 1:1. Server CI still compile-verifies.
- Next: auth (real tenant from JWT), remaining modules, then Stage F wiring.

### 2026-06-09 (Stage E — backend foundation)
- Scaffolded the **`server/`** workspace: NestJS 10 + Prisma 5 + PostgreSQL. Separate from the frontend
  (does not deploy to Pages); excluded from the root tsconfig so the Pages build is unaffected.
- **Prisma schema** — multi-tenant core of the 61-table model: organisations, users, buildings (+zones,
  equipment), the **42-field `ElectricityBill`**, diagnoses & loss findings, tasks, alerts, documents,
  activity log, CAPEX, GHG, interval readings. Every org-scoped table has `orgId`.
- **Row-level security** (`prisma/rls.sql`) — DB-enforced tenant isolation; `PrismaService.withOrg()` sets
  `app.current_org` per transaction.
- **Modules** — health, buildings (list/by-id), bills (POST 42-field DTO + list/by-id) — mirror the
  frontend `api.portfolio` / `api.bills` contracts. Seed creates the demo org + buildings + a sample bill.
- **Server CI** workflow compiles it on GitHub runners (`prisma validate` + `generate` + `tsc`) — my only
  way to verify the backend without Node locally.
- Next: port the 58-check diagnosis engine server-side, add auth (real tenant from JWT), then Stage F
  (wire the frontend `lib/api/*` bodies to these endpoints).

### 2026-06-09 (Conversion-journey audit + fixes)
- Audited the delivered build (see [CUSTOMER-JOURNEY.md](./CUSTOMER-JOURNEY.md)); fixed the two real
  friction problems:
  - **Broken conversion loop:** every savings-result CTA went to `/login`, a fake wall that dead-ended at
    "check your inbox", losing the analysed bill. Rewired the result to flow into the live workspace
    ("See it in your dashboard"/"Open your dashboard" → /app; opportunity "Explore" → /app/markets); login
    success now offers "Continue to your workspace →" /app. Principle: explore first, commit later.
  - **Silent no-op buttons:** added a minimal toast (`components/ui/toast.tsx`) + `DemoButton`; wired every
    demo action (Export deck, Generate BRSR/NOC, Award bid, Request quote, training, Save changes, Save
    audit, redeem) to honest feedback instead of nothing.

### 2026-06-09 (Stage C — interaction & navigation polish)
- **Breadcrumbs** in the app topbar (path-derived, i18n-aware, hidden on mobile).
- **Scroll restoration:** the app content scroll region resets to top on every route change.
- **Route transition:** subtle `animate-in fade-in` on content (respects reduced-motion via globals).
- **Skip-to-content** link (keyboard/SR a11y) in the root layout; `#main-content` on app/public/field shells.
- **Magic-link login** is now a client form with inline email validation (disabled-until-valid, aria-invalid
  + described-by error, success state) — `components/auth/magic-link-form.tsx`.
- **i18n scaffold:** `lib/i18n/dictionary.ts` (English + Hindi catalogues, 5 more locales fall back) +
  `LocaleProvider` (context, localStorage persistence, hydration-safe). Wired into the root layout; the
  **Settings → Language picker now switches locale live** (sidebar nav + topbar re-label instantly, e.g.
  Hindi). Other languages persist and fall back to English until their catalogues are added.

### 2026-06-09 (Stage D — mock-API seam)
- Built `lib/api/*` (portfolio, tasks, alerts, field, sustainability, capex, markets, ecosystem, bills) +
  an aggregating `api` object. Async typed functions returning fixtures today, swap-ready for Stage F.
- Migrated **every** screen to read through the seam: ~15 server pages now `await api.*`; the interactive
  client components (analyze, tasks, alerts, capex, settings, field × 5) receive initial data as props
  from their server-page wrappers. Verified no `app/`/`components/` file imports `lib/mock/*` anymore.
- Boundary: data records → `api.*`; pure logic (diagnosis engine, ROI math, formatting, loss taxonomy)
  stays in `lib/*`. Client components import runtime constants from the specific `lib/api/<domain>`
  submodule (not the index) to keep their bundles lean.

### 2026-06-09 (Stage B7 — Stage B complete)
- **Stage B7 complete — ecosystem & growth.** From `lib/mock/ecosystem.ts`:
  - **Marketplace** (`/app/marketplace`) — vendor directory, RFQs, and a **reverse auction** ranking sealed
    bids by total cost of ownership (best bid flagged).
  - **Training** (`/app/training`) — course catalogue with progress bars, levels, completion KPIs.
  - **Rewards** (`/app/leaderboard`) — G01 leaderboard (buildings ranked by EPI → points), G02 rewards
    (points / tier / redeem), and earned/locked badges.
  - **Settings** (`/app/settings`, replaces the last stub) — Organisation, **Language (ML01)** selector
    (English + 6 regional), and Notification channel toggles.
  - **Public pages** — `/pricing` (Free/Pro/Enterprise), `/privacy` (DPDP), `/terms`, `/status`,
    `/developers` (API), `/roi-calculator` (public, reuses the ROI calculator). Footer now links them all,
    fixing the earlier public dead-ends.
  - Nav: Marketplace, Training, Rewards.
- **Stage B (all screens) is done.** Every sidebar item and public link resolves to a real screen on mock
  data; no stubs remain. Next: interaction-polish pass + the Stage D mock-API seam.

### 2026-06-09 (Stage B6)
- **Stage B6 complete — energy markets & assets.** From `lib/mock/energy-markets.ts`:
  - **Carbon** (`/app/carbon`, replaces the stub) — GHG inventory: Scope 1/2/3 totals, emissions-by-scope
    chart, per-scope source breakdown (Scope 2 marked auto-from-bills).
  - **Markets** (`/app/markets`) — tabs: **Open access** (eligibility → charges → NOC journey with a
    per-kWh cost build-up: exchange + wheeling/CSS/additional/transmission/losses vs grid tariff → net
    saving + annual ₹), **IEX** (DAM/RTM KPIs + day-ahead price-by-block chart), **Carbon credits** (CCTS
    held/value/retired + credits-by-project).
  - **Assets** (`/app/assets`) — tabs: **BESS** (sizing, demand + arbitrage saving split, payback),
    **Microgrid** (H13: islanding hours, reliability, renewable share, components), **VPP** (H14:
    dispatchable kW aggregated across sites, DR events/revenue, DER mix).
  - Added nav: Markets, Assets. Carbon stub is now real.
- Next: Stage B7 (ecosystem & growth).

### 2026-06-09 (Stage B5)
- **Stage B5 complete — decision-makers.** From `lib/mock/sustainability.ts` and `lib/mock/capex.ts`:
  - **Executive summary** (`/app/executive`, D07) — board-ready single screen: spend / savings / carbon /
    ESG / Net Zero / compliance KPIs, spend trend, top risks, top opportunities, "Export deck" (PDF/PPT at
    Stage G).
  - **Compliance** (`/app/compliance`) — tabs: **Scorecard** (R13, obligations table + overall %), **BRSR**
    (R01, section progress, environment auto-filled, generate-report), **ESG** (R02, pillar breakdown).
  - **CAPEX approvals** (`/app/capex`, F10) — interactive workflow FM → EM → CFO → Board with approve/reject
    advancing the stage; pending / pipeline / approved KPIs.
  - Added nav: Executive, Approvals, Compliance.
- OCR remains explicitly simulated (labelled in the demo; strategy in OCR-STRATEGY.md).
- Next: Stage B6 (energy markets & assets).

### 2026-06-08 (Bill engine: correctness audit — the heart)
- Reviewed the engine hard (every consumer relies on it). Fixed real bugs and made it honest:
  - **No false positives from missing OCR fields.** Demand checks (1.1/1.2/1.3) now require BOTH contract
    and recorded demand present — previously a missing `maxDemand`/`contractDemand` (reads 0) could
    "recommend cutting demand to zero" or flag a phantom penalty. Guards added across all detectors.
  - **Demand rate is read from the bill** (`fixedDemandCharges/billingDemand`) instead of a hardcoded ₹450.
  - **Recoverable vs opportunity split.** Headline = "you're overpaying ~₹X/yr" (penalties/errors you can
    stop now); open access / solar / BESS move to a separate "bigger moves (potential)" section — a
    decision, not a current loss. Matches the funnel: propose losses → progressively ask about solar /
    15-min data → convert via "talk to an advisor".
  - **Dropped an over-promise:** the prompt-payment-rebate check fired for nearly every bill; moved to
    "needs the tariff order" instead of asserting a loss we can't verify.
  - **Open-access eligibility keyed off the energy rate**, not the bill total (arrears no longer distort it).
  - Removed the old 3-check `diagnose()` (single engine now); documented every check's field+formula+
    assumption in **docs/BILL-ENGINE.md**.

### 2026-06-08 (Bill engine: full loss taxonomy)
- Engine previously ran only 3 checks (CD, PF, ToD). Rebuilt it to the **complete 58-check taxonomy**
  across 10 categories (`lib/loss-taxonomy.ts`) with a real engine (`lib/diagnosis.ts`):
  - Every bill now runs **all 58 checks**. 15 are assessable from a single bill (compute a ₹ figure or
    "clear"); the other 43 are marked **"needs more data"** with the exact data that unlocks them
    (15-min interval, sub-metering, building profile, fuel bills, tariff order, 12-month history,
    power-quality survey, open-access inputs, portfolio, records).
  - Result screen is **numbers-first**: total ₹/yr, coverage line (X found / Y need data / Z clear),
    top action, category ₹ breakdown, plain opportunity list, and an "Unlock more" panel grouping the
    missing checks by data needed. All technicalities are behind a **"Show all 58 checks"** toggle.
- Note: the taxonomy summary totals **58** (the instruction said 52); built all 58.
- Next: resume Stage B5 (decision-makers).

### 2026-06-08 (Stage B4)
- **Stage B4 complete — field roles (mobile-first, offline-tolerant).** All inside the FieldShell
  (bottom-nav, safe-area), reading from `lib/mock/field.ts`:
  - **Work orders** (`/field/work-orders` + `[id]`) — O03 list + detail with an O09 **inspection checklist**
    (checkable, progress bar), photo/GPS capture (mock), and a "Complete" gate that needs all checks done.
    Detail statically exported via `generateStaticParams`.
  - **On-site audit** (`/field/audit`, A04) — sectioned measurement capture (Lighting/HVAC/Motors/Compressed
    air), live progress, photo + GPS capture, "save on device".
  - **Collection** (`/field/collection`, L03/L04/L08) — optimised route of stops with cash/UPI **record
    payment**; collected/pending KPIs update live.
  - **Field home** (`/field`) — greeting, quick tiles, "up next" work orders.
  - Shared **SyncStatus** banner conveys offline tolerance (go offline → changes "saved on device" → Sync).
  - Updated FIELD_NAV (Home / Work / Audit / Collect).
- Next: Stage B5 (decision-makers).

### 2026-06-08 (Stage B3)
- **Stage B3 complete — act on insight.** Three interactive (client) areas, each behind a server page:
  - **Tasks** (`/app/tasks`) — Kanban + list views; tasks auto-created from diagnoses/alerts/audits with
    source, priority, assignee, due, savings. Cards move between To do / In progress / Done; KPIs incl.
    open savings. (`lib/mock/tasks.ts`)
  - **Alerts** (`/app/alerts`) — N03 active-alert dashboard (acknowledge/resolve) + N01 rules tab with
    active toggles (PF<0.90, MD>90% CD, bill anomaly, EPI deviation, missing bill, meter offline). KPIs.
    (`lib/mock/alerts.ts`)
  - **ROI calculator** (`/app/roi`, E12) — live payback / IRR / NPV / lifetime savings; prefill from
    recommended ECM presets (CD reduction, APFC, ToD, solar, BESS). Pure math in `lib/finance.ts`.
  - Added `Calculator` nav item for ROI; replaced the tasks/alerts stubs.
- Next: Stage B4 (field roles).

### 2026-06-08 (Stage B2)
- **Stage B2 complete — account & portfolio.** All in the AppShell, reading from a new portfolio mock
  module (`lib/mock/portfolio.ts`, 6 buildings, deterministic to avoid hydration mismatch):
  - **Dashboard** (`/app`) — portfolio KPIs, 12-month spend bar chart, top-opportunity buildings.
  - **Bills** (`/app/bills`) — KPIs, month-on-month bar chart, recent-bills table (sticky header,
    scrollable, status badges, pagination footer stub).
  - **Buildings** (`/app/buildings`) — consolidated multi-site view (B21): totals strip + building cards
    with data-quality flags ("N bills missing").
  - **Building profile** (`/app/buildings/[id]`) — auto-populated profile, KPIs, spend trend, recent
    bills. Static-exported via `generateStaticParams`.
  - **Analytics** (`/app/analytics`) — tabs for Forecast (B20: 12 actual + 3 projected), Budget vs actual
    (F09: over/under tones + variance), and Portfolio (D01: EPI + savings by building).
  - Added shared `PageHeader`, `StatCard`, and a dependency-free `BarChart`.
  - Added graceful stubs for not-yet-built nav items (tasks/alerts/carbon/settings) so the sidebar has no
    dead ends.
- Next: Stage B3.

### 2026-06-08 (Stage B1 + hosting)
- **Stage B1 complete — the core loop.** Built the anonymous, value-before-signup flow at `/analyze`:
  upload (drag/drop + photo + "try a sample") → extracting (skeleton + live status) → review all **42
  fields** (grouped, editable, low-confidence flagged with "Check") → savings result (headline ₹/yr, top
  action, ranked findings with severity). Edits to fields re-run the diagnosis live.
- Added `lib/mock/bill.ts` — the 42-field sample bill + a real `diagnose()` engine (contract-demand
  optimisation, power-factor/APFC, ToD arbitrage). This is the seed of the Stage D mock-API seam.
- **Hosting wired up.** `next.config.mjs` → static export with Pages basePath; `.github/workflows/deploy.yml`
  builds on GitHub runners and deploys to Pages. Pages enabled via API (build_type=workflow).
- Fixed the earlier `/analyze` dead-end (landing CTA now lands on the real flow).
- Next: Stage B2.

### 2026-06-08 (Stage A)
- **Stage A complete.** Hand-wrote the full design foundation (no Node on this laptop; builds elsewhere):
  - Tailwind v3 + PostCSS config; `components.json`; design tokens (light/dark, energy-green brand, chart
    palette) in `globals.css` with focus-visible, reduced-motion, thin scrollbar + safe-area utilities.
  - `lib/utils.ts` (cn) and `lib/format.ts` (Indian ₹ lakh/crore, units, DD-MM-YYYY).
  - UI primitives: button, card, input, label, badge, skeleton, separator, table (sticky-header +
    scrollable), tabs, spinner. State components: empty-state, error-state.
  - Four layout shells with scroll/linking baked in: PublicShell (sticky header), AuthShell (centered),
    AppShell (pinned sidebar+topbar, single scroll region, mobile drawer w/ Esc + scroll-lock + active-nav),
    FieldShell (mobile bottom-nav, safe-area).
  - Framework state files: `loading.tsx` (skeletons), `error.tsx` (recoverable), `not-found.tsx`.
  - Demo routes wiring every shell + a `/styleguide` gallery showing the four states.
- Next: Stage B1 core-loop screens.

### 2026-06-08 (later)
- Saved Phase 2 as locked **SPEC_V2.md** (28 microservices, 18 integrations, 25 templates, 15 calc engines,
  15 datasets, security/DPDP, tech stack, 34-sprint roadmap, testing matrix).
- **Reworked PLAN.md to a SCREENS-FIRST approach**: build the whole UI with mock data first (every screen,
  scrolling, linking, loading/empty/error, responsive, a11y) behind a stable mock-API seam, then backend →
  wire endpoints → integrations → harden, without touching the UI.
- Added a per-screen **Definition of Done** covering the small details: scrolling, navigation/linking, the
  four states, Indian formatting, keyboard/focus, i18n.
- Next: begin Stage A (design foundation).

### 2026-06-08
- Saved Phase 1 audit as locked **SPEC_V1.md** (203 pages, 61 tables, 42 bill fields, 12 personas, 19 modules).
- Reframed the enterprise scope into **PLAN.md**: a thin-vertical-slice build plan organised around the core
  loop (upload → diagnose → savings → action) and a minimum-friction North Star.
- Established working cadence: pick lowest open milestone item → build slice → validate scale + friction →
  push to git → update this log.
- Next: begin M0.
