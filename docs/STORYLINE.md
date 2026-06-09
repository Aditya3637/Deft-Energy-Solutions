# Deft Energy Solutions — The Storyline (LIVING)

> The one document that tells the whole story end-to-end — **why** we built this, **what** it does,
> **how** we deliver it, and **how every module is made**. Fetchable from any machine.
>
> Companions: [SPEC_V1.md](./SPEC_V1.md) (scope) · [SPEC_V2.md](./SPEC_V2.md) (technical) ·
> [PLAN.md](./PLAN.md) (build order) · [PROGRESS.md](./PROGRESS.md) (session log) · [TODO.md](./TODO.md) (backlog).

---

## 1. Why we built this

Indian commercial & industrial (C&I) electricity bills quietly **leak money**, every month, in ways the
customer cannot see:

- **Hidden recurring losses** — power-factor penalties, wrong contract demand, tariff misclassification,
  time-of-day mismatch, metering/billing errors, avoidable late-payment surcharges. These are real rupees,
  already being overpaid, recoverable with **no capex**.
- **Untapped levers** — the customer is also *leaving money on the table*: they consume more than they need
  (no efficiency programme), buy power at the full DISCOM tariff (no open access / exchange), don't generate
  or store their own (no solar/BESS), and don't monetise what they save (carbon credits, demand response,
  payment cashback).

A plant manager or CFO has neither the time nor the specialist knowledge to find all of this on a 42-field HT
bill, let alone act on it. **Deft Energy makes the invisible visible and the visible capturable** — it reads
the bill, quantifies every leak and lever in rupees, and walks the customer from "here's what you're losing"
to "here's the money captured."

**The bar:** a real, live, production-grade product — not a pilot. Designed for **~50,000 bills/month and
~5,000 monthly active users**. Every module ships complete and is tested from a customer's angle.

---

## 2. What this product does — the savings ladder

The whole product is one promise: **every rupee on your electricity bill is being lost, overpaid, or
under-earned — we find it and capture it.** That promise is a **five-rung ladder**, each rung a distinct
mechanism for moving money:

| Rung | Mechanism | Money type | Where it lives |
|------|-----------|-----------|----------------|
| **Recover** | 58-check diagnosis: PF, contract demand, tariff, ToD, billing errors, late fees | No-capex, immediate | `/analyze`, `/app/bills` |
| **Reduce** | Efficiency / ECMs — cut the consumption itself (LED, HVAC, VFD, compressed air) | Capex-led, biggest long-run | `/app/efficiency` |
| **Reprice** | Open access + the power exchange (IEX/PXIL) vs the DISCOM tariff | Per-unit savings | `/app/markets` |
| **Generate** | Solar + battery (peak-shave + arbitrage), microgrid, VPP | Capex savings + DR revenue | `/app/assets` |
| **Earn** | Carbon credits (CCTS), demand response, bill-payment cashback | Money back | `/app/carbon`, `/app/collections` |

**The core loop** (the whole product compressed): **upload a bill → instant diagnosis → quantified savings →
one recommended action.** It works for an anonymous visitor with no signup — value before signup is the
acquisition wedge.

**The Savings Stack** (`/app/savings`) is the money story made tangible: it attributes ₹ to *every* rung and
totals it — "we can move ₹X/yr, N% of your spend" — with each rung linking to where you act. The app
navigation itself is grouped by the ladder (Overview · Recover · Reduce/Reprice/Generate · Earn & comply),
and the public landing tells the same five-rung story, so marketing and product are one narrative.

**Monetization** wraps the ladder: a free funnel (anonymous analysis) → **14-day Pro trial** → **recurring
Pro subscription** (Razorpay), with **entitlement enforcement**, an **in-app upgrade prompt** at the quota
wall, and **dunning** (a grace window + email) so one failed charge doesn't lose a customer.

---

## 3. How we deliver this product — architecture & delivery

**Screens-first, behind a typed seam.** The entire UI was built and polished against a **mock-API seam**
(`lib/api/*`) — typed client functions that returned fixtures first. The backend was then wired *behind the
same signatures*, so no screen had to change. That seam is still the contract today.

**Dual build — one codebase, two surfaces:**
- **GitHub Pages** — a static export (`output: "export"`) that serves the **demo** (deterministic fixtures).
  This is the always-on showcase; it never needs a backend.
- **Vercel SSR** — the **live** product. A `liveServer()` gate (Vercel + an API base configured) flips every
  seam from fixture to a real `apiFetch` against the backend. Server components fetch the signed-in org's
  real data; React `cache` dedupes per render.

**Backend** — **NestJS + Prisma + PostgreSQL on Render**. Multi-tenant isolation is enforced at the database
with **row-level security**: every request runs inside `PrismaService.withOrg(orgId, tx => …)`, which sets
`app.current_org` so Postgres policies (see `prisma/rls.sql`) scope every query to that org. Money is stored
as **integer paise (BigInt)** — never floats.

**Auth** — hand-rolled **HS256 magic-link sessions** (no heavy dependency), mirrored to an **SSR cookie** so
server-rendered pages are scoped to the signed-in org. Anonymous / invalid tokens **fail safe to a shared
demo org**, preserving "value before signup." DPDP Act 2023 self-service (access / export / correct / erase /
consent) is built.

**External integrations use a provider-seam pattern** (OCR, BBPS bill-fetch, IEX prices, carbon registry,
payments, notifications): a **built-in fallback that works today** (a `log`/`mock`/`indicative` provider, no
account needed) plus a **real provider that activates the moment its env keys are set**. The product is fully
demonstrable with zero credentials, and goes live by flipping config — never by rewriting code.

**CI is the quality gate** — GitHub Actions runs, on every push:
- **Server CI** — `prisma validate` + `generate`, a full `tsc` type-check/build, a **Docker image build**,
  and a growing set of **pure-logic invariant scripts** (one per high-stakes module, run via `ts-node`).
- **Pages** — the static export build + deploy.

Nothing ships red. The invariant scripts encode the **no-false-positive discipline** as executable tests.

**Working model — git-only.** All code/assets live in GitHub. Each work session: **clone → work → push →
delete**; nothing is kept on the local machine. These living docs (PLAN/PROGRESS/TODO/STORYLINE) are the
memory that travels with the repo.

---

## 4. How modules are made — the repeatable recipe

Every domain module follows the same shape, which is *why* the product stays coherent as it widens. The
guiding rule across all of them is the **no-fabrication discipline**: **derive from the org's real data;
where a number is genuinely external or estimated, label it (indicative / potential); when the data isn't
there, return an honest zero or a "needs-data" state — never invent.**

**A. Data-derived module** (e.g. compliance, carbon, markets, assets, ecosystem, efficiency, billing):

1. **Pure compute core** — a deterministic, I/O-free function (e.g. `*.compute.ts`, `plans.ts`,
   `savings-stack.ts`). All the logic and all the discipline live here, so it can be unit-tested without a
   database.
2. **Service** — reads the org's real rows under RLS (`withOrg`) and feeds the pure core. No business logic
   leaks into the service.
3. **Controller** — exposes `GET /v1/<domain>` (and writes where needed) using the `@CurrentOrg()` /
   `@CurrentSession()` decorators. Anonymous → demo org; quota/entitlement enforced for signed-in orgs only.
4. **Module** — registered in `app.module.ts`.
5. **Frontend seam** — `lib/api/<domain>.ts`: `liveServer()` → `apiFetch` the real endpoint (React `cache`);
   otherwise a deterministic fixture from `lib/mock/*`. Types mirror the server shape so call sites never
   change.
6. **Page** — a server component that `await`s the seam and renders; honest empty/loading/error states.
7. **CI invariant** — a `scripts/<domain>-check.ts` that exercises the pure core over **multiple personas
   across multiple DISCOMs / building kinds**, asserting correctness, **no false positives**, and finite/
   bounded numbers. Wired into `server-ci.yml` + an `npm run <domain>:check` script.
8. **Docs** — a `PROGRESS.md` entry and a `TODO.md` update.

**B. External-integration module** (the provider seam — OCR, BBPS, IEX, registry, payments, notifications):

- A **core** file: shared types + **provider selection** from env + **pure mappers** (response → our shape),
  which are the part CI tests (no network).
- A **default provider** that works with no account (`log` / `mock` / `indicative` / `manual`).
- A **real provider** (raw `fetch`, no SDK) gated by env keys, with retry on transient errors.
- A **dispatch** layer + a service method; failures **degrade gracefully** to the fallback (a dashboard
  always renders; a webhook never breaks; sign-in still succeeds).

**Customer-angle testing** (the standing rule): after a module ships, it's exercised as a customer would —
a persona + ~7–8 real bills across **multiple DISCOMs** — encoded as a CI invariant where the logic is
deterministic, and flagged as credential-blocked where it needs a live key (e.g. vision-OCR).

---

## 5. The shape today (one-paragraph status)

The core savings loop and the full decision-maker breadth are **live**: diagnosis (Recover), efficiency
(Reduce), markets/open-access (Reprice), assets/BESS (Generate), carbon/collections (Earn), compliance,
ecosystem, the consolidated **Savings Stack**, and the **monetization engine** (plans → trial → recurring →
dunning) — each behind the dual-build seam and locked by CI invariants, with a **notification layer**
delivering magic-link + dunning emails. What remains is mostly **operational** (flip credentials: OCR key,
Razorpay keys, email provider, BBPS licence) or **net-new build** (a scheduler for proactive digests; the
Audit / O&M / DMS / Admin-RBAC / Financial spec modules). The running backlog is in [TODO.md](./TODO.md).
