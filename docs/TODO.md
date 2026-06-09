# Deft Energy — TODO / Backlog (LIVING)

> Fetch this from any machine: it's the running picture of what's built and what's left.
> See [PLAN.md](./PLAN.md) (strategy), [PROGRESS.md](./PROGRESS.md) (session log).
>
> **Bar: production-grade, live product — not a pilot.** Every module ships complete, no gaps,
> and is tested from a customer angle (a persona + ~7–8 real bills across multiple DISCOMs).
> "Demo mode" is only ever a clearly-labelled fallback when a real credential/licence is absent.

---

## Built ✓ (live)

- **UI (Stages A–D):** all screens, mock-API seam, interaction/nav polish, responsive, a11y.
- **Backend (Stage E/F):** NestJS + Prisma + PostgreSQL on Render, RLS multi-tenant; portfolio / tasks /
  alerts / bills wired live on Vercel SSR.
- **Bill extraction (OCR/VLM):** provider-agnostic (Anthropic vision · OpenAI-compatible/Llama/Gemini ·
  digital-PDF text-parse), per-DISCOM templates, confidence + mandatory human review, corrections-capture
  loop, accuracy dashboard. *(needs the backend vision key to OCR live — see big-ticket #3.)*
- **BBPS / DISCOM-portal bill fetch:** provider seam scaffolded (mock + generic aggregator), 15-DISCOM catalog.
- **Savings Stack (`/app/savings`):** one lever-attributed money view (Recover / Reduce / Reprice /
  Generate / Earn), composed from the live seams; nav regrouped by the value ladder.
- **Efficiency engine (`/app/efficiency`, the "Reduce" rung):** ECM library × real consumption (by building
  kind), capped at 30%; `GET /v1/efficiency`; CI `efficiency:check`. No overlap with the diagnosis.
- **Diagnosis engine (58 checks):** correctness-audited (false-positive fixes), invariant-tested in CI, +
  a **multi-DISCOM persona test** (8 DISCOMs).
- **Payments & due-date tracking** (multi-asset: overdue / due-soon / paid-on-time).
- **Collection-agent backend (SANDBOX):** money in integer paise, idempotent, per-DISCOM licence +
  commission models, remittance/float, dunning worklist; **BBPS connector wired** (Setu-style, env-gated).
- **Core loop closed:** analyze → savings → `/app/bills` (your analyzed bills + ₹) → "Add to my tasks".
- **Auth (Stage H foundation):** verified HS256 sessions + magic-link; spoofable `x-org-id` removed;
  **SSR cookie session** (signed-in users see their own org server-side); anonymous → demo (value before signup).

---

## Big-ticket (focus items)

1. **Real-money go-live — BBPS licence track** (PLAN §7): Agent-Institution/BBPOU onboarding → sponsor/
   escrow bank → NPCI/BBPOU certification + real biller IDs → flip licences `SANDBOX→ACTIVE` → settlement
   reconciliation (DSR). *Blocked on licensing/banking (external).*
2. **Live vision-OCR validation across DISCOMs:** set `ANTHROPIC_API_KEY` on the backend, run ~7–8 real
   bills per DISCOM end-to-end, measure per-DISCOM accuracy on the dashboard, tune templates. *Blocked on key.*
3. **Magic-link email delivery** (SES/Resend) + set `AUTH_SECRET`/`APP_URL` → fully self-serve sign-in.
4. ~~**Carry savings everywhere:** dashboard + building detail show the user's saved bills + recoverable ₹.~~
   ✅ done — both surface `bills.listAnalyzed()` (live on Vercel SSR, fixture on static); building view
   filters by `buildingId`.
5. **Stage H harden:** **DPDP self-service ✅** — access/export, correction, erasure (atomic cascade
   delete), consent recorded at signup, grievance contact (`/v1/account/*` + Settings → Privacy & data).
   *Still:* retention auto-purge cron, perf @ 50k bills/mo + 5k MAU, full test matrix
   (unit/integration/E2E/contract/perf/security/a11y), VAPT, error monitoring + structured logging.
6. **Remaining integrations (Stage G):**
   - ✅ **IEX/PXIL price feed — adapter scaffolded** (`server/src/markets/iex/`): provider seam
     (`IEX_PROVIDER=http` + `IEX_BASE_URL`/`IEX_API_KEY`) with pure response mapper; `GET /v1/markets/iex`
     returns the live feed when configured, else the indicative reference (UI labels which). *Live needs a
     market-data account.*
   - ✅ **Carbon-credit (CCTS) registry — adapter scaffolded** (`server/src/markets/registry/`): provider
     seam (`REGISTRY_PROVIDER=http` + `REGISTRY_BASE_URL`/`REGISTRY_API_KEY`); real held/retired overlay the
     estimated potential on `GET /v1/markets`. *Live needs a registry account.* CI: `integrations-check.ts`.
   - Still pending: smart-meter/AMI, BMS/IoT, WhatsApp/SMS, DISCOM tariff scraping.
7. **Module breadth → live:** wire mock breadth modules to the real backend domain-by-domain.
   - ✅ **Compliance** — `GET /v1/compliance` derives the scorecard / BRSR Principle-6 / ESG-Environment
     from the org's real bills, buildings and GHG inventory (no-false-positive discipline; CI invariant
     `compliance-check.ts` over 5 multi-DISCOM personas). Feeds both `/compliance` and `/executive`.
   - ✅ **B6 — Carbon / Markets / Assets** — `GET /v1/carbon` (Scope 2 from bills × CEA grid factor,
     per-DISCOM split; Scope 1/3 from recorded GHG inventory), `GET /v1/markets` (open-access economics
     from real bill line-items + carbon-credit *potential* from avoided emissions), `GET /v1/assets`
     (BESS sizing + microgrid + VPP from peak demand, ToD spread and the Equipment registry). No
     fabrication when data is absent; external inputs (IEX price, CCC spot) labelled *indicative* in the
     UI pending the Stage-G feeds. CI invariant `markets-check.ts` over multi-DISCOM personas.
     IEX + carbon-credit-registry **adapters now scaffolded** (see #6) — flip to live with an account.
   - ✅ **B7 — Leaderboard / Marketplace / Training** — `GET /v1/leaderboard` (badges earned from real
     PF / trend / avoided-emissions / on-time-payment data; reward points from a transparent activity
     ledger), `GET /v1/marketplace` (curated vendor directory + **RFQs from the org's real
     `CapexRequest` records** + reverse auction on the top open RFQ), `GET /v1/training` (curated course
     library). Honest empty states: no vendor-bidding system yet → 0 bids; no progress store yet →
     courses at 0%. CI invariant `ecosystem-check.ts` over multi-DISCOM personas.
     Transactional follow-ups tracked in #8.

8. **Transactional features still read-only / mock** (each needs new RLS tables → `schema.prisma` +
   `prisma/rls.sql` table list + the DPDP erase cascade in `account.service.ts`, plus endpoints + UI):
   - **RFQ / vendor-bidding workflow** — create RFQ → place bids → award. New `Rfq` + `Bid` tables (RLS);
     marketplace already shows the org's RFQs (from `CapexRequest`) read-only with an honest 0-bid state.
   - **Per-learner course-progress store** — persist Start/Continue progress. New `CourseProgress` table
     (RLS); training catalog is live, progress is currently fixed at 0%.
   - **Capex approval → live** — `/app/capex` still reads the mock; `CapexRequest` exists server-side
     (marketplace RFQs already read it). Wire the live read + request/approve flow (FM→EM→CFO→Board).

---

## Backlog (small / later)

- [ ] Thread the session token through the remaining manual-header client fetches (payments, collections,
      extract, billfetch) so every surface is org-consistent for signed-in users.
- [ ] httpOnly session cookie set via a route handler (more secure than the JS cookie).
- [ ] Roles & org membership + invite teammates (OWNER/FM/EM/CFO…).
- [ ] Pagination / virtualisation on bills & payments tables (50k-row scale).
- [ ] Settlement reconciliation (DSR file ↔ `Remittance` rows) for collections.
- [ ] Per-DISCOM template expansion driven by the accuracy dashboard's "hardest fields".
- [ ] Server-side PDF→image rasteriser so the free `openai`/Llama provider can handle scanned PDFs.
- [x] **Monetization (Plan tiers → entitlements → payment).** ✅ Plan catalog + pure entitlement gates
      (`server/src/billing/`, CI `billing-check.ts`); `GET /v1/billing(/plans)` with live usage; pricing
      page + Settings "Plan & billing" panel. ✅ **Enforcement** (402 over quota, signed-in only — free
      funnel intact) + **payment seam** (manual default + Razorpay + signature-verified webhook activation)
      + `UpgradeButton`. ✅ **No-card 14-day Pro trial** (`POST /v1/billing/trial`, effective-plan derived,
      no cron) + **recurring auto-renewing Razorpay Subscriptions** (`RAZORPAY_PLAN_ID_PRO`; subscription.*
      webhooks activate/downgrade; one-time link fallback). *To take real money:* `PAYMENTS_PROVIDER=razorpay`
      + keys (+ `RAZORPAY_PLAN_ID_PRO` for auto-renew). ✅ **Dunning** (`subscription.pending` → 7-day
      `past_due` grace, then auto-downgrade; red banner) + **402 → in-app upgrade prompt** (`ApiError` →
      `bills.create` surfaces the limit → `UpgradePrompt` in the analyze flow). *Future:* per-seat proration,
      dunning email/WhatsApp nudges during grace.
- [ ] Customer-angle test harness for payments + collections modules (persona + multi-DISCOM).
- [ ] Migrate CI actions to Node 24 (deprecation warning on actions/* @v4 / node20).
- [ ] Bill detail page: show the full 58-check diagnosis (findings + needs-data) per saved bill.

---

## Customer-angle test status (per the production bar)

| Module | Test | Status |
|---|---|---|
| Diagnosis engine | persona + 8 DISCOMs, no-false-positive invariants (CI) | ✅ `npm run persona:check` |
| Commission / collections math | money invariants (CI) | ✅ `npm run collections:check` |
| Auth (JWT) | sign/verify/tamper/kind-confusion (CI) | ✅ `npm run auth:check` |
| Compliance (scorecard/BRSR/ESG) | 5 personas, no-false-positive (CI) | ✅ `npm run compliance:check` |
| Markets & DER (B6) | multi-DISCOM personas, honest-zeros (CI) | ✅ `npm run markets:check` |
| Ecosystem (B7) | badges/RFQs/rewards personas (CI) | ✅ `npm run ecosystem:check` |
| Integration adapters (IEX/registry) | provider select + pure mappers (CI) | ✅ `npm run integrations:check` |
| Bill extraction (vision-OCR) | real PDFs per DISCOM, end-to-end | ⏳ needs backend key (big-ticket #2) |
| Payments / collections flows | persona + multi-DISCOM | ⏳ backlog |
