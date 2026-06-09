# Deft Energy Solutions — Build Plan (LIVING DOCUMENT)

> Executable counterpart to [SPEC_V1.md](./SPEC_V1.md) (scope) and [SPEC_V2.md](./SPEC_V2.md) (technical).
> The specs say *what exists*; this says *what we build, in what order, and why*. Updated every session.
> Current status: [PROGRESS.md](./PROGRESS.md).
>
> **Approach (adopted): SCREENS FIRST.** Build and polish the entire UI with mock data — every screen,
> every interaction, scrolling, navigation/linking, loading/empty/error states, responsiveness — behind a
> stable mock-API seam. *Then* build the backend, wire real endpoints, and add integrations without
> touching the UI. The mock seam means the frontend never has to change when the backend lands.

---

## 0. North Star: intuitive, simple, minimum friction

The spec is large (203 pages, 19 modules). The product must **not feel** large. Every decision is judged
against one question: *does this reduce the steps between a user and the value they came for?*

**Design principles (apply to every screen):**

1. **One primary action per screen.** A single obvious thing to do; everything else is secondary.
2. **Value before signup.** Core loop (upload a bill → see savings) works for an anonymous visitor.
3. **Zero-config defaults.** Tariff/DISCOM/units inferred from the bill, never asked up front. Advanced
   settings are progressively disclosed, never blocking.
4. **Show, don't make them compute.** The platform does the math; users confirm, they don't calculate.
5. **Three clicks to insight.** Landing → concrete savings number in ≤3 interactions.
6. **Forgiving input.** OCR-first with inline correction; partial data still yields partial insight.
7. **Progressive depth.** FM and CFO see the same data at different altitudes; depth is opt-in.
8. **Mobile-first for field roles** (FM, auditor, collection agent); offline-tolerant where flagged.

---

## 1. Build philosophy: screens first, behind a mock-API seam

Why screens-first here: the product *is* its UX. The risk in a 203-page platform is not "can the backend
compute it" — it's "does it feel simple." Building the full UI first, with realistic mock data, lets us
feel and fix the friction *before* committing expensive backend/integration work. The hardest, most
valuable design work (navigation, density, flow) gets done when it's cheapest to change.

```
Stage A  Design foundation  → tokens, components, layout shells, global UX details
Stage B  Screens (static)   → every screen rendered with mock data, responsive, all states
Stage C  Interaction polish → routing/linking, forms, scroll, transitions, a11y, i18n
Stage D  Data seam          → mock-API layer matching real contracts; swap-ready hooks
─────────────────────────────  (UI complete & demoable here — looks and feels real) ─────────
Stage E  Backend services   → NestJS services + PostgreSQL schema (61 tables), core first
Stage F  Wire endpoints     → replace mock seam with real APIs, contract-tested, no UI change
Stage G  Integrations       → OCR, IEX, IoT/BMS, payments, notifications, scraping
Stage H  Harden             → security/DPDP, perf at 50k bills/5k MAU, full testing matrix
```

The **mock-API seam** (Stage D) is the linchpin: every screen reads/writes through typed client functions
(e.g. `api.bills.upload()`, `api.bills.list()`) that initially return fixtures. Stage F swaps the
implementation behind those same signatures. Nothing in Stages A–C changes.

---

## 2. The core loop (the whole product, compressed)

> **Upload a bill → instant diagnosis → quantified savings → one recommended action.**

Every module is an elaboration of this loop. We build its screens first and most polished, then widen
outward. If a screen doesn't make this loop better or wider, it waits.

---

## 3. Definition of Done — every screen must pass this

This is the "small details" checklist. **No screen is done until all apply.** (Tracked per screen in
PROGRESS.md.)

**Layout & scrolling**
- [ ] Responsive at 360 / 768 / 1024 / 1440 px; no horizontal overflow; content reflows, never clips
- [ ] Correct scroll behaviour: page scrolls, not the whole app; sticky headers/toolbars stay put;
      long lists/tables scroll within their container with the header pinned
- [ ] Scroll position restored on back-navigation; modals lock background scroll; `scroll-to-top` on route change
- [ ] Safe-area / notch handling on mobile; bottom nav never covers content

**Navigation & linking**
- [ ] Every link/button goes somewhere real (no dead ends); breadcrumbs where depth > 2
- [ ] Browser back/forward works; deep links load the right state; active nav item is highlighted
- [ ] External links open appropriately; in-app links use the router (no full reloads)

**States (every screen has all four)**
- [ ] **Loading** — skeletons, not spinners-on-blank; never layout-shift when data arrives
- [ ] **Empty** — helpful empty state with the one action to fix it (not a blank box)
- [ ] **Error** — recoverable message + retry; never a raw stack trace
- [ ] **Populated** — realistic mock data (real DISCOM names, plausible ₹ amounts, Indian formatting)

**Input & forms**
- [ ] Inline validation with clear messages; primary action disabled until valid; no data loss on error
- [ ] Forgiving input (OCR correction inline); autosave/draft where a form is long
- [ ] Keyboard: tab order logical, Enter submits, Esc closes; visible focus rings

**Polish**
- [ ] Indian formatting: ₹ lakh/crore grouping, kWh/kVA units, DD-MM-YYYY dates
- [ ] Transitions/feedback: toasts for actions, optimistic UI, hover/press states
- [ ] Accessibility: WCAG 2.1 AA — contrast, labels, ARIA, screen-reader landmarks
- [ ] All strings externalised (i18n-ready: English first, Hindi + 5 regional later)
- [ ] Reads through the mock-API seam (no hardcoded data inside components)

---

## 4. Stage plan (each stage is shippable / demoable)

### Stage A — Design foundation
- [ ] Design tokens: colour, typography, spacing, radius, shadow, z-index, breakpoints
- [ ] Tailwind config + shadcn/ui set up (matches SPEC_V2 stack)
- [ ] Core components: button, input/select/textarea, card, table (sortable + paginated), modal/drawer,
      tabs, toast, badge, skeleton, empty-state, error-boundary, breadcrumb, pagination, chart wrappers
- [ ] Layout shells: **public** (marketing), **auth** (magic-link), **app** (sidebar + topbar + content),
      **mobile/field** (bottom nav, offline-tolerant) — each with scroll behaviour baked in
- [ ] Storybook for components (visual-regression ready)

### Stage B — Screens (static, mock data), in core-loop-first order
Build the 203 screens in this priority, each meeting the Stage-3 DoD:
- [ ] **B1 Core loop:** landing → bill upload (drag/photo) → OCR review (42 fields, inline correct) →
      diagnosis → **savings result** (headline number + top action) → save/signup prompt
- [ ] **B2 Account & portfolio:** building profile, bill history/trends, multi-site consolidated (B21),
      portfolio analytics (D01), forecast/budget (B20, F09)
- [ ] **B3 Act on insight:** tasks (CL03), alerts (N01–N04), ROI calculator (E12), retrofit recs
- [ ] **B4 Field (mobile):** on-site audit (A04), maintenance/work orders (O02/O03/O09), collection (L03/L04/L08)
- [ ] **B5 Decision-makers:** BRSR (R01), ESG dashboard (R02), compliance scorecard (R13), executive
      summary (D07), CAPEX approval (F10)
- [ ] **B6 Markets & assets:** open access (B11→C10), IEX/carbon trading, BESS, microgrid (H13), VPP (H14)
- [ ] **B7 Ecosystem:** gamification (G01/G02), marketplace + reverse auction, training, localisation (ML01),
      public pages (P13 DPDP/ToS, P19 ROI calculator, API docs, status)

### Stage C — Interaction & navigation polish
- [ ] Full routing graph wired; deep links; breadcrumbs; scroll restoration; route transitions
- [ ] Forms: validation, drafts, optimistic UI; large-list virtualisation/pagination (50k bills in mind)
- [ ] Keyboard nav + focus management end-to-end; a11y audit (axe/Lighthouse) per page
- [ ] i18n wiring (string catalogue, locale switch shell)

### Stage D — Mock-API data seam
- [ ] Typed client (`/lib/api/*`) mirroring SPEC_V2 service contracts; fixtures for every entity
- [ ] Loading/error simulation (latency, failures) so states are real; React Query (or equiv) caching
- [ ] **Checkpoint: UI is complete, navigable, and feels real end-to-end.**

### Stage E — Backend services (SPEC_V2 §1)
- [ ] PostgreSQL schema: 61 tables, RLS multi-tenancy, 42-field `electricity_bills` (nullable)
- [ ] NestJS services, core first: auth, org, building, bill-ingest, bill-diagnostics, tariff, notification
- [ ] Processing lanes scaffold (real-time / near-real-time / batch / on-demand)

### Stage F — Wire real endpoints
- [ ] Swap mock seam → real APIs behind identical signatures; Pact contract tests; no UI changes

### Stage G — Integrations (SPEC_V2 §2) — IN PROGRESS
- [x] **Bill extraction (OCR/VLM):** real, provider-agnostic pipeline — Anthropic vision (default) +
      OpenAI-compatible/Llama/Gemini + **digital-PDF text-parse**; per-DISCOM templates; confidence +
      mandatory human review; corrections-capture loop; accuracy dashboard. *(code-complete; needs a
      vision-LLM key on the backend to run live.)*
- [x] **BBPS / DISCOM-portal bill fetch:** scaffolded behind a provider seam (mock + generic aggregator
      adapter); 15-DISCOM catalog. *(needs a real aggregator account to fetch live.)*
- [x] **Payments & due-date tracking** (multi-asset: overdue / due-soon / paid-on-time, derived status).
- [x] **Collection-agent backend (SANDBOX):** money in integer paise, idempotent, per-DISCOM license +
      commission models, remittance/float, dunning worklist; commission math invariant-tested in CI.
      Connector seam ready. *(real money is gated on the BBPS license track — see §7.)*
- [ ] **Go live on real money — the BBPS license track (§7).**
- [ ] IEX/PXIL prices, smart-meter/AMI, BMS/IoT (EMQX→Kafka→TimescaleDB), WhatsApp/SMS/email,
      DISCOM tariff scraping

### Stage H — Harden
- [~] **Auth & multi-tenant (IN PROGRESS):** real per-org identity via verified HS256 session tokens +
      magic-link (`/v1/auth/request|verify|me`); a non-RLS `Account` table bootstraps email→org. The
      spoofable `x-org-id` header is **no longer trusted** — anonymous (no/invalid token) safely falls back
      to the demo org, preserving "value before signup." Crypto invariants run in CI. **Deferred:** live
      email delivery (link is returned/logged for now), **SSR cookie session** (server-rendered pages stay
      demo-scoped until the token is read from a cookie), threading the token through the remaining
      manual-header client fetches (extract/billfetch/payments/collections), and roles/membership.
- [ ] Security + DPDP (RLS, consent, retention, Vault, VAPT); perf to 50k bills/mo + 5k MAU
- [ ] Full testing matrix (unit/integration/E2E/contract/perf/security/a11y/visual/chaos)

---

## 5. Cross-cutting, designed in from screen one (not bolted on)

- **Scale:** lists paginate/virtualise; tables assume tens of thousands of rows; benchmark views cache.
  Validated against ~50k bills/month + ~5k MAU.
- **Activity log + DMS:** every artifact has a home in the document UI; every action has an activity entry —
  designed into screens now, persisted later.
- **DPDP Act 2023:** consent prompts, data-principal self-service (download/correct/delete), retention —
  UI present from the start.
- **Localisation-ready:** all strings externalised from the first component; multi-script OCR planned.

---

## 6. Working cadence (how I run this continuously)

1. Pick the next unchecked item in the lowest open stage (A→H).
2. Build it to the **Definition of Done** (§3) — scrolling, linking, all states, responsive, a11y.
3. Validate against the North Star ("three clicks to insight") and scale assumptions.
4. Commit + push to GitHub (git-only; nothing kept on the laptop).
5. Update [PROGRESS.md](./PROGRESS.md): what shipped, screen-DoD checklist, what's next, open questions.
6. Repeat.

Default: when something is ambiguous, build the **lowest-friction** interpretation and note the assumption
in PROGRESS.md rather than blocking.

---

## 7. Collection-agent go-live — the BBPS license track (REAL MONEY)

> The collection-agent backend is built and money-safe (Stage G, SANDBOX). Going live is **not a code
> task** — it's a regulated onboarding track with external dependencies. The code already has the seam
> (`server/src/collections/connector.ts`, `lib/api/billfetch.ts`, env `COLLECTIONS_LIVE`); this section is
> the sequence to obtain the licence and connect it. See [COLLECTION-AGENT.md](./COLLECTION-AGENT.md).

**Decide the standing (two ways to "have the BBPS licence"):**
- **G7.0a — Agent Institution (AI) under a BBPOU** *(recommended first — fastest to revenue).* Onboard
  beneath an existing RBI-authorised Bharat Connect/BBPS Operating Unit (e.g. an aggregator: Setu/Pine
  Labs, BillAvenue/Euronet, Cashfree, PayU). We get agent access to many DISCOM billers at once, collect,
  and earn per-txn commission; settlement is T+1 via the BBPOU's sponsor bank.
- **G7.0b — Become a BBPOU ourselves** *(the literal "take the licence to ourselves" — heavy/slow).* RBI
  authorisation under the PSS Act; substantial net-worth requirement (~₹25 cr historically), audits,
  ongoing compliance. Multi-quarter+; pursue once volume justifies it. Run G7.0a in parallel meanwhile.
- **G7.0c — DISCOM-direct agency agreements** (MSEDCL collection-centre, UPPCL onboarding) in parallel for
  the %-commission / current-vs-arrears models, where direct beats BBPS economics.

**Onboarding sequence (track each as a checklist item):**
- [ ] **G7.1 Entity & compliance:** company KYC/AML, GST, RBI posture (PA/PG if we ever hold consumer
      funds — prefer pass-through/escrow so we don't), DPDP data-handling sign-off.
- [ ] **G7.2 Pick & sign the BBPOU/aggregator** (AI agreement) **and/or** DISCOM agency agreements.
- [ ] **G7.3 Settlement banking:** open the sponsor / nodal / escrow account; map the settlement flow
      (consumer → escrow → DISCOM; commission → us). No money sits on our books.
- [ ] **G7.4 Certification / UAT:** complete the BBPOU + NPCI test suite (bill-fetch + bill-pay cases) per
      DISCOM biller; obtain real **biller IDs** → fill `server/src/billfetch/biller-catalog.ts`.
- [~] **G7.5 Connect the code (IN PROGRESS):**
      - [x] `bbps` connector **implemented** (`connector-bbps.ts`, Setu-style: OAuth token, async
        fetch/pay, paise, tolerant parsing) and wired into `create()` (BBPS-mode → `payBill` before
        persist, idempotent via the rail's txn reference). Env-gated by `COLLECTIONS_LIVE` + `BBPS_*`;
        defaults to `mock`. **Not yet run against a live sandbox — needs creds (G7.2/7.4).**
      - [ ] obtain sandbox creds → set `BBPS_*` secrets; confirm the exact endpoints/field names against
        the chosen aggregator's live docs (they vary) and adjust the mapping;
      - [ ] flip each `DiscomLicense` `SANDBOX → ACTIVE` only after its certification;
      - [ ] wire **settlement reconciliation (DSR)**: match the aggregator/DISCOM daily settlement file to
        our `Remittance` rows; surface mismatches.
- [ ] **G7.6 Operate:** refunds/chargebacks, dispute handling, commission invoicing/reconciliation,
      immutable audit trail, per-DISCOM monitoring, and the field collection route (`/field/collection`)
      wired to live worklist + proof-of-payment.

**Money-safety guardrails (already enforced in code, keep enforcing):** integer paise only; idempotency
keys (no double-collect); explicit state machine; commission math invariant-tested in CI; licences default
SANDBOX; nothing moves real funds until G7.5 flips a certified licence to ACTIVE.

**Definition of "live" for one DISCOM:** a real bill fetched from the rail → consumer payment captured to
escrow → remitted to the DISCOM and reconciled against its settlement file → commission booked — with a
full audit trail. Ship DISCOM-by-DISCOM, not all at once.
