# Deft Energy Solutions — Build Plan (LIVING DOCUMENT)

> This is the **executable** counterpart to [SPEC_V1.md](./SPEC_V1.md). The spec says *what exists*;
> this plan says *what we build, in what order, and why*. It is updated every working session.
> Current status lives in [PROGRESS.md](./PROGRESS.md).

---

## 0. North Star: intuitive, simple, minimum friction

The spec is large (203 pages, 19 modules). The product must **not feel** large. Every decision is judged
against one question: *does this reduce the steps between a user and the value they came for?*

**Design principles (apply to every page we build):**

1. **One primary action per screen.** Each page has a single obvious thing to do; everything else is secondary.
2. **Value before signup.** The core loop (upload a bill → see savings) works for an anonymous visitor.
   Account creation is asked for only when there's something to save.
3. **Zero-config defaults.** Sensible defaults for tariff, DISCOM, units — inferred from the bill, never
   asked up front. Advanced settings are progressively disclosed, never blocking.
4. **Show, don't make them compute.** The platform does the math (savings, ROI, normalisation). Users
   confirm, they don't calculate.
5. **Three clicks to insight.** From landing to a concrete savings number in ≤3 interactions.
6. **Forgiving input.** OCR-first with inline correction; partial data still produces partial insight.
7. **Progressive depth.** A facility manager and a CFO see the same data at different altitudes; depth is
   opt-in, never forced.
8. **Mobile-first for field roles** (FM, auditor, collection agent); offline-tolerant where the spec flags it.

---

## 1. Build philosophy: thin vertical slices, not modules

We do **not** build module-by-module (that produces 19 half-finished silos and no usable product for months).
We build **end-to-end vertical slices** — each slice is a complete user journey that ships and delivers value
on its own, then later slices deepen it.

```
Slice = (one persona) × (one job) × (full stack: UI → API → DB → result)
```

Each slice must be: shippable, demoable, and independently valuable. We only add the next slice once the
current one is intuitive and working.

---

## 2. The core loop (this is the whole product, compressed)

> **Upload a bill → instant diagnosis → quantified savings → one recommended action.**

Everything in the 19 modules is an elaboration of this loop. We build the loop first, end to end, then widen
it. If a feature doesn't make this loop better or wider, it waits.

---

## 3. Milestones (each is shippable)

Milestones are ordered by *value-per-unit-friction*, not by module number. Check items off in PROGRESS.md.

### M0 — Foundation (enable everything else)
- [ ] App shell, routing, design system (tokens, typography, components) tuned for the North Star
- [ ] Multi-tenant data layer: PostgreSQL + row-level security, `organisations`/`buildings`/`users` core
- [ ] Auth (passwordless / magic-link first to cut signup friction)
- [ ] `electricity_bills` table with all **42 fields** (nullable — partial data is valid)
- [ ] Processing split scaffolding (real-time / near-real-time / batch / on-demand lanes)

### M1 — Core loop, anonymous (the demo that sells)
- [ ] **B01 Bill upload** — drag/drop or photo; OCR extraction of the 42 fields with inline correction
- [ ] Instant **diagnosis engine** v1: PF penalty, contract-demand mismatch, tariff misclassification, ToD
- [ ] **Savings result screen**: one headline number + top 1 action, plain language, no jargon
- [ ] "Save this analysis" → magic-link signup (value-before-signup)

### M2 — Account & portfolio
- [ ] Building profile (auto-populated from bill fields 2, 4, 5, 6, 7)
- [ ] **B21 Multi-site consolidated view** + **D01 portfolio analytics** (for chains/owners)
- [ ] **B20 bill forecast & budget**; **F09 budget vs actual**
- [ ] Bill history, trends, month-on-month

### M3 — Act on insight (close the loop)
- [ ] **Tasks (CL03)** auto-created from diagnoses; assign/track (Kanban + list)
- [ ] **Notification & Alert Engine (N01–N04)**: thresholds (PF<0.90, MD>90% CD, EPI deviation)
- [ ] **E12 ROI calculator** + recommended retrofits/ECMs surfaced from diagnosis

### M4 — Field roles (mobile-first, offline-tolerant)
- [ ] **A04 on-site audit** (photo/GPS/instrument capture); **O02/O03/O09** maintenance + work orders
- [ ] **L03/L04/L08** collection agent flows
- [ ] Offline sync layer for the above

### M5 — Compliance & executive (decision-makers)
- [ ] **R01 BRSR**, **R02 ESG dashboard**, **R13 compliance scorecard**
- [ ] **D07 executive summary dashboard** (board-ready, one-click PDF/PPT)
- [ ] **F10 CAPEX approval workflow** (FM→EM→CFO→Board, digital sign-off)

### M6 — Energy markets & assets (highest complexity, highest ceiling)
- [ ] Open Access journey (B11→C10, wheeling/CSS/additional-surcharge calc)
- [ ] IEX/carbon trading; **H13 microgrid**, **H14 VPP**; BESS arbitrage from ToD rates

### M7 — Ecosystem & growth
- [ ] **G01/G02 gamification**, **ML01 localisation** (Hindi + 5 regional), **white-label portal**
- [ ] Marketplace, reverse auction, training academy
- [ ] Public pages: **P13 DPDP/ToS**, **P19 ROI calculator** (lead-gen), API docs, status page

---

## 4. Cross-cutting, built in from day one (not bolted on later)

These are not milestones — they are constraints baked into every slice:

- **Scale:** every query, table, and pipeline validated against ~50k bills/month + ~5k MAU. Index for it;
  paginate; batch bill processing; cache benchmarks.
- **Activity log + DMS:** every artifact (bill, report, certificate) lands in `documents`; every action logs
  to `activity_log`. Wire these as we build each slice, not in a separate pass.
- **DPDP Act 2023:** consent, data minimisation, right-to-deletion, retention windows (bills 7yr) — designed
  in, not retrofitted.
- **Localisation-ready:** all UI strings externalised from the first component; multi-script OCR planned.

---

## 5. Working cadence (how I run this continuously)

1. Pick the next unchecked item in the lowest open milestone.
2. Build it as a thin vertical slice (UI→API→DB→result), honoring the North Star.
3. Validate against the scale target and the "three clicks to insight" rule.
4. Commit + push to GitHub (git-only; nothing kept on the laptop).
5. Update [PROGRESS.md](./PROGRESS.md): what shipped, what's next, open questions.
6. Repeat.

Default: when a milestone item is ambiguous, build the **lowest-friction** interpretation and note the
assumption in PROGRESS.md rather than blocking.
