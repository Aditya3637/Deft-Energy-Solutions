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
5. **Stage H harden:** DPDP (consent, retention, export/delete self-service), perf @ 50k bills/mo + 5k MAU,
   full test matrix (unit/integration/E2E/contract/perf/security/a11y), VAPT, error monitoring + logging.
6. **Remaining integrations (Stage G):** IEX/PXIL prices, smart-meter/AMI, BMS/IoT, WhatsApp/SMS,
   DISCOM tariff scraping.
7. **Module breadth → live:** capex / compliance / carbon / markets / assets / marketplace / training are
   still mock; wire to real backend domain-by-domain.

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
- [ ] Subscription/billing wiring (Plan tiers → entitlements).
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
| Bill extraction (vision-OCR) | real PDFs per DISCOM, end-to-end | ⏳ needs backend key (big-ticket #2) |
| Payments / collections flows | persona + multi-DISCOM | ⏳ backlog |
