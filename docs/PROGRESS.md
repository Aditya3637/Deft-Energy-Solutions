# Deft Energy Solutions — Progress Log (LIVING)

> Updated every working session. Newest entry on top. See [PLAN.md](./PLAN.md) for stages & DoD.

## Current state

- **Approach:** SCREENS FIRST (UI + mock-API seam fully built and polished, then backend → endpoints → integrations)
- **Active stage:** Stage A — Design foundation (✅ DONE; pending an `npm install && npm run build` on a
  Node machine — this laptop has no Node, so the foundation is hand-written and not yet built here)
- **Next action:** Stage B1 — core-loop screens: landing→upload→OCR review (42 fields)→diagnosis→savings
  result, built to the per-screen Definition of Done, reading through a mock-API seam
- **Routes live:** `/` (PublicShell), `/styleguide` (components + 4 states), `/app` (AppShell dashboard),
  `/field` (FieldShell), `/login` (AuthShell)

## Open questions / assumptions

- **Tailwind v3, not v4.** SPEC_V1 mentioned "Tailwind CSS 4"; chose v3 + classic config for robustness
  when hand-authoring without a local build. Revisit if v4 is required.
- **No web fonts yet.** System font stack via `--font-sans` to avoid build-time font fetching; swap in a
  brand font (e.g. Inter via next/font) later.
- Marketing CTAs `/analyze`, `/pricing`, `/privacy`, `/terms` are Stage B routes — currently a graceful 404.

## Log

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
