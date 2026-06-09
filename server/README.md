# Deft Energy Solutions — Backend (Stage E)

NestJS + Prisma + PostgreSQL. This is the start of the real backend that the
frontend's `lib/api/*` seam will call at Stage F. It is a **separate workspace**
from the Next.js frontend — it does not deploy to GitHub Pages.

## What's here (Stage E core)

- **Prisma schema** (`prisma/schema.prisma`) — the multi-tenant core of the
  61-table model: organisations, users, buildings (+ zones, equipment), the
  **42-field `ElectricityBill`**, diagnoses & loss findings, tasks, alerts,
  documents, activity log, CAPEX, GHG, interval readings. Every org-scoped table
  carries `orgId`.
- **Row-level security** (`prisma/rls.sql`) — DB-enforced tenant isolation via
  `current_setting('app.current_org')`. `PrismaService.withOrg()` sets it per
  transaction.
- **Modules** — `health`, `buildings` (GET list/by-id), `bills` (POST create with
  the 42-field DTO, GET list/by-id), `diagnosis` (the **58-check engine ported
  server-side** + persistence). These mirror the frontend `api.*` contracts.
- **Diagnosis engine** (`src/diagnosis/`) — the exact frontend engine
  (loss-taxonomy + detectors + recoverable/opportunity buckets). Creating a bill
  auto-runs it and stores a `Diagnosis` + one `LossFinding` per detected loss.

## Run it

**Easiest — Docker (server + Postgres), one command from the repo root:**

```bash
docker compose up --build      # boots Postgres, syncs schema, applies RLS, seeds, serves
# → http://localhost:4000/v1/health
```

**Or natively:**

```bash
cp .env.example .env           # point DATABASE_URL at a Postgres
npm install
npx prisma db push             # create tables
npm run prisma:rls             # apply RLS policies
npm run seed                   # demo org + buildings + a sample bill
npm run start:dev              # http://localhost:4000/v1/health
```

## Deploy (managed Postgres + auto-deploy)

`render.yaml` (repo root) is a Render Blueprint: connect this repo to Render
(**New → Blueprint**) and it provisions a managed Postgres + this service from
`server/Dockerfile`, injects `DATABASE_URL`, and on boot runs `prisma db push` →
applies RLS → seeds → serves. Health check: `/v1/health`. Auto-deploys on push.
(Any Docker host works — point `DATABASE_URL` at a Postgres and run the image.)

## Endpoints (prefix `/v1`)

| Method | Path             | Notes |
| ------ | ---------------- | ----- |
| GET    | `/health`        | liveness |
| GET    | `/buildings`     | tenant's buildings |
| GET    | `/buildings/:id` | one building |
| POST   | `/bills`         | create a bill (42-field DTO) → auto-diagnoses & returns the diagnosis |
| GET    | `/bills`         | recent bills (with diagnosis summary) |
| GET    | `/bills/:id`     | one bill + diagnosis + findings |
| POST   | `/diagnosis`     | stateless: `{ fields: [{key,value}] }` → full diagnosis |
| POST   | `/bills/:id/diagnose` | re-run + persist diagnosis for a bill |

Tenant is taken from the `x-org-id` header (falls back to the demo org) until
real auth (JWT) lands at Stage F.

## CI

`.github/workflows/server-ci.yml` runs `prisma validate` + `prisma generate` +
`tsc` build on every change under `server/` — compile verification without a DB.

## Next (later Stage E / F)

- Auth (OIDC/JWT) → real tenant from the token; remove the `x-org-id` fallback.
- Tasks / alerts / sustainability / capex / markets modules to complete the seam.
- Remaining tables (interval data at TimescaleDB scale, trading, marketplace, audit).
- Wire the frontend `lib/api/*` bodies to these endpoints (Stage F).
