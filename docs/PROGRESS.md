# Deft Energy Solutions — Progress Log (LIVING)

> Updated every working session. Newest entry on top. See [PLAN.md](./PLAN.md) for stages & DoD.

## Current state

- **Approach:** SCREENS FIRST (UI + mock-API seam fully built and polished, then backend → endpoints → integrations)
- **Active stage:** A ✅ · B1 ✅ · B2 ✅ · B3 ✅ · B4 (field roles) ✅ DONE
- **Hosting:** GitHub Actions → static export → GitHub Pages. The build runs on GitHub's runners (so it
  also verifies the code compiles, since this laptop has no Node). Live URL:
  https://aditya3637.github.io/Deft-Energy-Solutions/
- **Next action:** Stage B5 — decision-makers: BRSR (R01), ESG dashboard (R02), compliance scorecard (R13),
  executive summary (D07), CAPEX approval (F10). Then formalise the Stage D mock-API seam.
- **Routes live (app):** `/app` · `/app/bills` · `/app/buildings` + `[id]` · `/app/tasks` · `/app/alerts` ·
  `/app/analytics` · `/app/roi` · `/app/{carbon,settings}` (stubs)
- **Routes live (field, mobile):** `/field` · `/field/work-orders` + `[id]` · `/field/audit` ·
  `/field/collection`
- **Other:** `/` · `/analyze` (B1) · `/styleguide` · `/login`

## Open questions / assumptions

- **Tailwind v3, not v4.** SPEC_V1 mentioned "Tailwind CSS 4"; chose v3 + classic config for robustness
  when hand-authoring without a local build. Revisit if v4 is required.
- **No web fonts yet.** System font stack via `--font-sans` to avoid build-time font fetching; swap in a
  brand font (e.g. Inter via next/font) later.
- **Charts are dependency-free** (hand-rolled `BarChart`) for now; swap to ECharts/Recharts (per SPEC_V2)
  later without changing callers.
- Marketing CTAs `/pricing`, `/privacy`, `/terms` are later-stage routes — currently a graceful 404.

## Log

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
