# Deft Energy Solutions — Progress Log (LIVING)

> Updated every working session. Newest entry on top. See [PLAN.md](./PLAN.md) for stages & DoD.

## Current state

- **Approach:** SCREENS FIRST (UI + mock-API seam fully built and polished, then backend → endpoints → integrations)
- **Active stage:** Frontend (A–D + C + journey) ✅ · **Stage E backend (engine + persistence + deploy setup) ✅**
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
  `/app/tasks` · `/app/alerts` · `/app/analytics` · `/app/roi` · `/app/capex` · `/app/compliance` ·
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
