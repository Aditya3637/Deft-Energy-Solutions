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
  the 42-field DTO, GET list/by-id). These mirror the frontend `api.portfolio` /
  `api.bills` contracts.

## Run it

```bash
cp .env.example .env          # point DATABASE_URL at a Postgres
npm install
npx prisma migrate dev        # create tables
npm run prisma:rls            # apply RLS policies (psql)
npm run seed                  # demo org + buildings + a sample bill
npm run start:dev             # http://localhost:4000/v1/health
```

## Endpoints (prefix `/v1`)

| Method | Path             | Notes |
| ------ | ---------------- | ----- |
| GET    | `/health`        | liveness |
| GET    | `/buildings`     | tenant's buildings |
| GET    | `/buildings/:id` | one building |
| POST   | `/bills`         | create a bill (42-field DTO) |
| GET    | `/bills`         | recent bills |
| GET    | `/bills/:id`     | one bill |

Tenant is taken from the `x-org-id` header (falls back to the demo org) until
real auth (JWT) lands at Stage F.

## CI

`.github/workflows/server-ci.yml` runs `prisma validate` + `prisma generate` +
`tsc` build on every change under `server/` — compile verification without a DB.

## Next (later Stage E / F)

- Port the 58-check diagnosis engine server-side (`/v1/diagnosis`) and persist
  `Diagnosis` + `LossFinding` per bill.
- Auth (OIDC/JWT) → real tenant from the token; remove the `x-org-id` fallback.
- Tasks / alerts / sustainability / capex / markets modules to complete the seam.
- Remaining tables (interval data at TimescaleDB scale, trading, marketplace, audit).
- Wire the frontend `lib/api/*` bodies to these endpoints (Stage F).
