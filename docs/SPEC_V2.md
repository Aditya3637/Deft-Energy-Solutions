# Deft Energy Solutions — Product Spec V2 (LOCKED)

> **Status:** Phase 2 complete and locked — backend architecture, integrations, assets, security,
> tech stack, roadmap, and testing. Production-ready reference.
> Companion to [SPEC_V1.md](./SPEC_V1.md) (scope) — this is the *technical* spec (how it's built).
> Executable build plan: [PLAN.md](./PLAN.md). Current progress: [PROGRESS.md](./PROGRESS.md).

**Scale target (non-negotiable):** ~50,000 bills/month, ~5,000 monthly active users.

---

## 1. Backend Microservices Architecture

**Style:** event-driven microservices. Each domain service publishes to a shared event backbone (Kafka);
consumers subscribe independently. Loose coupling, independent deploy, resilience under load.

**API Gateway:** Kong (rate limiting, auth, SSL) fronting Web (Next.js), Mobile (React Native), Partner API.

### 28 Services

| #  | Service                     | Domain     | Responsibility | Store |
| -- | --------------------------- | ---------- | -------------- | ----- |
| 1  | `auth-service`              | Platform   | OAuth2/OIDC, SSO, MFA, sessions | PostgreSQL |
| 2  | `org-service`               | Core       | Orgs, subscription plans, billing | PostgreSQL |
| 3  | `building-service`          | Core       | Buildings, zones, equipment & IoT registry | PostgreSQL |
| 4  | `bill-ingest-service`       | Analysis   | Bill upload, OCR orchestration, validation | PostgreSQL + S3 |
| 5  | `ocr-engine`                | Analysis   | OCR worker → Azure Doc Intelligence / Google Doc AI; 42 fields | Redis queue |
| 6  | `bill-diagnostics-service`  | Analysis   | CD/PF/tariff/ToD analysis, OA eligibility | PostgreSQL |
| 7  | `tariff-service`            | Analysis   | DISCOM tariff DB, auto-update via scraping | PostgreSQL |
| 8  | `benchmark-service`         | Analysis   | EPI, benchmarks, peer compare, weather normalisation | PostgreSQL |
| 9  | `energy-efficiency-service` | Core       | ECM library, retrofit recs, project planning, M&V | PostgreSQL |
| 10 | `carbon-service`            | Trading    | GHG inventory (Scope 1/2/3), emission factors | PostgreSQL |
| 11 | `trading-service`           | Trading    | Carbon credits, IEX view, REC/ESCert, transactions | PostgreSQL |
| 12 | `open-access-service`       | Trading    | OA feasibility, state charges, SLDC NOC, group captive | PostgreSQL |
| 13 | `compliance-service`        | Core       | BRSR, RPO, ECBC, ISO 50001, regulatory calendar | PostgreSQL |
| 14 | `audit-service`             | Core       | Audit engagements, field data, report builder | PostgreSQL |
| 15 | `collection-service`        | Operations | Consumers, billing, collection, commissions, reconciliation | PostgreSQL |
| 16 | `bess-service`              | Operations | BESS sizing, peak shaving, ToD arbitrage, DG replacement | PostgreSQL |
| 17 | `ev-service`                | Operations | EV chargers, sessions, revenue, site assessment | PostgreSQL |
| 18 | `maintenance-service`       | Operations | Assets, PM scheduling, work orders, AMC, breakdowns | PostgreSQL |
| 19 | `marketplace-service`       | Platform   | Vendors, RFQ/RFP, bid comparison, POs | PostgreSQL |
| 20 | `finance-service`           | Platform   | ROI, ESCO structurer, green loans, subsidies, budget | PostgreSQL |
| 21 | `notification-service`      | Platform   | Alert rules, email/SMS/push/WhatsApp, escalation | PostgreSQL + Redis |
| 22 | `document-service`          | Platform   | DMS, versioning, approvals, e-sign | PostgreSQL + S3 |
| 23 | `analytics-service`         | Platform   | Reports, predictive analytics, anomaly detection, export | PostgreSQL + ClickHouse |
| 24 | `training-service`          | Platform   | Courses, learning dashboard, webinars, certs | PostgreSQL |
| 25 | `iot-gateway-service`       | Operations | BMS/IoT ingest (BACnet/Modbus/MQTT/OPC UA), edge | TimescaleDB |
| 26 | `scheduler-service`         | Platform   | Cron: bill processing, reports, benchmarks, scraping | Redis |
| 27 | `search-service`            | Platform   | Full-text search across all entities | Elasticsearch |
| 28 | `gamification-service`      | Platform   | Leaderboards, badges, points, rewards | PostgreSQL |

### Data Processing Lanes

| Lane | Latency | Sources | Pipeline | Store |
| ---- | ------- | ------- | -------- | ----- |
| Real-time | <1 min | BMS (BACnet/Modbus), IoT (MQTT), EV status, meters | EMQX → Kafka → iot-gateway | TimescaleDB |
| Near-real-time | 1–15 min | 15-min meter data, IEX DAM/RTM, alerts | Kafka → Flink/Spark → PG/Timescale | TimescaleDB + PG |
| Batch | hourly/daily | Bill OCR, reports, benchmarks, tariff updates | Scheduler → BullMQ workers → PG | PG + ClickHouse |
| On-demand | seconds | BRSR/audit reports, projections, PDF exports | API → worker → S3 | S3 |

**Kafka topics** organised by domain: `core/*`, `billing/*`, `energy/*` (incl. high-volume
`readings.interval-15min`), `trading/*` (incl. `market.iex-price-update` every 15 min), `operations/*`,
`compliance/*`, `alerts/*`, `platform/*`. 30+ topics total with a schema registry.

---

## 2. Integration Layer

### BMS/IoT protocols (5)
BACnet/IP (HVAC), Modbus TCP/RTU (meters/VFDs — universal in India), MQTT 5.0 (IoT/edge), KNX (lighting in
premium fit-outs), OPC UA (industrial/data centres). **Edge gateway** (Raspberry Pi / Intel NUC, Ubuntu
22.04) does protocol translation → unified MQTT over TLS → EMQX → iot-gateway-service → TimescaleDB.
72-hour local SQLite buffer for offline tolerance.

### External APIs (18)
1. IEX (DAM/RTM/TAM/REC, every 15 min) · 2. PXIL (backup) · 3. ICM Portal (carbon; scrape→API when live)
· 4. Smart Meter/AMI (DLMS/COSEM via HES/MDMS) · 5. Azure Document Intelligence (primary OCR) ·
6. Google Document AI (multi-language fallback) · 7. Weather (OpenWeatherMap/IMD, CDD/HDD) · 8. Google
Maps/Geocoding · 9. Razorpay/PayU (payments + webhooks) · 10. WhatsApp Business (Meta) · 11. SMS
(MSG91/Twilio) · 12. Email (SendGrid/AWS SES) · 13. DigiLocker/e-Sign · 14. DISCOM portals (Playwright
scraping) · 15. Firebase Cloud Messaging · 16. Elasticsearch · 17. India Solar Resource Map (NREL/MNRE)
· 18. BIS/CEA grid emission factors.

---

## 3. Asset Inventory

- **UI/UX:** 50+ SVG icons, 30+ illustrations (SVG/Lottie), 15 chart types (Recharts/ECharts/D3), 3 map
  views (Mapbox/Leaflet), 8 logo variants, 1 Figma design system.
- **Document templates (25):** BEE audit reports (detailed/preliminary/IGA), BRSR, GRI, CDP, TCFD, ESCO
  contracts, Solar PPA, AMC, RFQ templates, DISCOM dispute letters, OA NOC (×10 states), CD revision
  (×20 DISCOMs), net metering, ISO 50001 checklist, IGBC/ECBC docs, carbon purchase agreement, CGWA return,
  electrical safety audit, inspection checklists, bill analysis summary, board deck.
- **Calculation engines (15, core IP):** EPI, PF penalty, CD optimiser, harmonics (IEEE 519-2022), tariff
  comparator, BESS sizing (LP optimisation), solar viability (PVSyst-equiv), GHG (IPCC AR6 + CEA factors),
  open-access savings, financial (DCF/IRR/NPV), M&V (IPMVP A/B/C/D), bill anomaly (Isolation Forest + LSTM),
  benchmark, carbon revenue projector, RPO compliance.
- **Reference data (15 pre-loaded datasets):** ~75 DISCOMs, ~2,000 tariff slabs, state OA charges,
  grid/fuel/refrigerant emission factors, ~250 ECMs, ~500 BEE benchmarks, net metering policies, RPO
  trajectories, climate zones (CDD/HDD), equipment efficiency, solar irradiance, green-loan/subsidy DB,
  state regulations, BEE auditor directory.

---

## 4. Security & DPDP Act 2023 Compliance

DPDP Act applies directly (penalties up to ₹250 cr/violation; full compliance by 13 May 2027). Controls:
explicit granular consent + withdrawal; multi-language privacy notice; data-principal self-service portal
(access/correct/erase/grievance, 15-day SLA); 72-hour breach notification; purpose limitation via OPA policy
tags; configurable retention (bills 7yr, interval data 3yr, personal data until consent withdrawn); DPO +
annual DPIA if designated Significant Data Fiduciary; data localisation (AWS Mumbai/Hyderabad).

**Security layers:** OAuth2/OIDC (Keycloak) + MFA + SAML SSO; RBAC + ABAC via OPA (12 roles); TLS 1.3 +
mTLS inter-service; AES-256 at rest + envelope encryption (PAN/GST/bank); Kong WAF + rate limiting;
PostgreSQL RLS by `org_id`; immutable `activity_log` (7yr); HashiCorp Vault secrets; Snyk/SonarQube/OWASP
ZAP in CI; annual CERT-In VAPT; daily backups + cross-region (RTO <4h, RPO <1h); ISO 27001 target month 12.

---

## 5. Tech Stack

| Layer | Choice |
| ----- | ------ |
| Web frontend | **Next.js 15 + React 19 + TypeScript** |
| Mobile | React Native + Expo (offline-first for field roles) |
| UI library | **shadcn/ui + Tailwind CSS** |
| Charts | Apache ECharts + Recharts |
| Maps | Mapbox GL JS |
| Backend | **Node.js + NestJS + TypeScript** |
| API protocols | REST (public) + GraphQL (frontend) + gRPC (inter-service) |
| Primary DB | **PostgreSQL 17 + Prisma** (RLS multi-tenancy) |
| Time-series | TimescaleDB |
| Analytics warehouse | ClickHouse |
| Search | Elasticsearch 8 |
| Cache/queues | Redis 7 + BullMQ |
| Event bus | Apache Kafka (Confluent) |
| MQTT | EMQX |
| OCR | Azure Document Intelligence (+ Google Doc AI fallback) |
| AI/ML | Python (FastAPI): scikit-learn, Prophet, TensorFlow Lite |
| Object storage | AWS S3 / Azure Blob |
| Orchestration | Kubernetes (EKS/AKS) |
| CI/CD | GitHub Actions + ArgoCD |
| IaC | Terraform + Helm |
| Observability | Prometheus + Grafana + Sentry + Jaeger |
| Logging | ELK |
| Cloud | AWS (India regions) for DPDP localisation |

**Note:** the web frontend choice (Next.js 15 + React 19 + TS + shadcn/ui + Tailwind) matches the current
repo scaffold — the screens-first build in PLAN.md uses exactly this.

---

## 6. 18-Month Roadmap (34 sprints, original waterfall view)

> NOTE: this is the spec's original delivery sequence. The **adopted** build approach is screens-first —
> see [PLAN.md](./PLAN.md), which re-sequences this into UI-first stages. Kept here as reference.

- **Phase 1 MVP (Mo 1–4, S1–S8):** infra + design system → auth/org → building profile → bill upload + OCR
  (42 fields) → diagnostics (CD/PF/tariff/ToD) → trends/benchmark/OA/solar → notifications/DMS/public pages
  → **MVP launch** (free bill analysis tool).
- **Phase 2 Carbon & Trading (Mo 5–7, S9–S14):** GHG inventory → IEX + OA → carbon portfolio/CCTS →
  BRSR/RPO/ECBC → CBAM/CDP/TCFD/GRI/Net Zero → **carbon launch**.
- **Phase 3 Audit + Marketplace (Mo 8–11, S15–S22):** audit mgmt → mobile audit app → energy balance/ECM →
  report builder → marketplace → finance → BESS → EV.
- **Phase 4 Operations & Scale (Mo 12–18, S23–S34):** collection → O&M → IoT gateway → efficiency engine →
  ISO 50001/envelope/lighting → analytics/BI → training/gamification → DR/microgrid/VPP → group captive/
  reverse auction/white-label → **full platform launch** + ISO 27001.

**Team:** 14 → 24 people (EM, 4→6 backend, 3→4 frontend, 0→2 mobile, 1→2 data, 0→1 ML, 0→1 IoT, 1→2
DevOps, 1→2 design, 1→2 QA, PM, domain expert).

---

## 7. Testing Matrix

- **Unit** (Jest/PyTest, 80%+) · **Integration** (Supertest/Testcontainers, all 28 APIs) ·
  **E2E** (Playwright/Detox, all 62 flows) · **Contract** (Pact) · **Performance** (k6/Artillery) ·
  **Security** (OWASP ZAP/Snyk/SonarQube + annual VAPT) · **Accessibility** (axe-core/Lighthouse, WCAG 2.1
  AA) · **Visual regression** (Chromatic/Storybook) · **Data validation** (OCR ≥99% on standard bills) ·
  **Chaos** (Litmus).
- **OCR accuracy targets:** HT industrial 98%+ (all 42 fields); LT commercial 95%+; LT domestic 90%+;
  multi-language regional scripts 90%+; poor-quality photos 85%+.
- **Performance benchmarks:** bill OCR <15s end-to-end; dashboard load <2s; IoT ingest <1s per 1,000-meter
  batch; 100 concurrent users <500ms p95; 100 simultaneous bill uploads within 5 min; search across 100k
  bills <500ms; 50-page BRSR PDF <30s; mobile cold start <3s; offline audit sync <60s.

---

## Summary counts

28 microservices · 30+ Kafka topics · 18 integrations · 5 BMS/IoT protocols · 25 templates · 15 calc engines
· 15 datasets · 12 security layers · 30+ stack components · 34 sprints / 18 months · 14→24 team · 10 test
types · 9 perf benchmarks. (Carrying from V1: 203 pages / 230+ with mobile · 61 tables · 12 personas · 62 flows.)
