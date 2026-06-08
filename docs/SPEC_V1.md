# Deft Energy Solutions — Product Spec V1 (LOCKED)

> **Status:** Phase 1 audit complete and locked (~98% coverage of what a dev team needs to begin building).
> This document is the authoritative scope reference for V1. It is **descriptive** (what exists).
> For the **executable build plan** (what we do, in what order), see [PLAN.md](./PLAN.md).
> For **current progress**, see [PROGRESS.md](./PROGRESS.md).

---

## Corrected Final Counts

| Item                      | Original v1            | After Audit             | Delta |
| ------------------------- | ---------------------- | ----------------------- | ----- |
| Pages                     | 167 (187 with mobile)  | 203 (230+ with mobile)  | +35   |
| Database Tables           | 42                     | 61                      | +19   |
| Bill OCR Fields           | ~18                    | 42                      | +24   |
| Personas                  | 10                     | 12                      | +2    |
| Validated Flows           | 50                     | 62                      | +12   |
| Cross-Cutting Modules     | 0                      | 6                       | +6    |
| Total Modules             | 13                     | 19                      | +6    |

**Scale target (non-negotiable):** design every layer for **~50,000 bills/month** and **~5,000 monthly active users**.

---

## A. Complete Bill OCR Field Map (42 Fields)

Indian commercial/industrial HT & LT bills contain far more fields than a naive parser captures. The
`electricity_bills` table and OCR extraction logic must capture all 42.

| #  | Field                                      | Why Critical |
| -- | ------------------------------------------ | ------------ |
| 1  | Consumer Number                            | Identity |
| 2  | Consumer Name & Address                    | Auto-populate building profile |
| 3  | DISCOM Name                                | Tariff lookup |
| 4  | Tariff Category (LT-I/LT-II/HT-I etc.)     | Tariff misclassification detection — a top savings opportunity |
| 5  | Supply Voltage (LT/HT/EHT)                 | Determines billing methodology (kWh vs kVAh) |
| 6  | Sanctioned/Connected Load (kW)            | CD optimisation, open-access eligibility |
| 7  | Contract Demand (kVA)                      | CD analysis |
| 8  | Billing Demand (kVA)                       | Many DISCOMs bill on max(MD, 75–90% of CD) — penalty detection |
| 9  | Maximum Demand Recorded (kW/kVA)          | CD analysis |
| 10 | MD Date & Time                            | Peak timing — essential for BESS/DR sizing |
| 11 | Energy Consumed (kWh)                     | Core |
| 12 | Reactive Energy (kVARh)                   | Harmonics/PF deep dive |
| 13 | Apparent Energy (kVAh)                    | Many HT tariffs bill in kVAh — different economics |
| 14 | Power Factor (average)                    | PF analysis |
| 15 | PF Incentive/Penalty Amount (₹)           | Direct savings quantification |
| 16 | PF Incentive/Penalty Rate (%)             | State-specific thresholds |
| 17 | Fixed/Demand Charges (₹)                  | Cost breakdown |
| 18 | Energy Charges (₹)                        | Cost breakdown |
| 19 | Wheeling Charges (₹)                      | Open-access savings calculation |
| 20 | Cross-Subsidy Surcharge (₹)               | Biggest barrier to OA economics |
| 21 | Additional Surcharge (₹)                  | Stranded cost charge — affects OA viability |
| 22 | ToD Peak kWh                              | ToD analysis |
| 23 | ToD Off-Peak kWh                          | ToD analysis |
| 24 | ToD Normal/Shoulder kWh                   | Many states have 3–5 ToD slots |
| 25 | ToD Peak/Off-Peak/Shoulder Rates (₹/kWh)  | BESS arbitrage calculation |
| 26 | Fuel Adjustment Charge / FAC / FPPCA (₹)  | Quarterly variable charge (₹0.50–2.00/unit) |
| 27 | Electricity Duty/Tax (₹)                  | State levy — 5–9% of bill |
| 28 | Meter Rent (₹)                            | Recurring — optimisable with own CT/PT |
| 29 | Transformer Losses Loading (%)            | HT consumers billed 2–5% loading |
| 30 | Surcharges (₹)                            | Catch-all |
| 31 | Taxes (₹)                                 | Catch-all |
| 32 | Arrears (₹)                               | Affects total payable |
| 33 | Late Payment Surcharge / Interest (₹)     | 1–2%/month — avoidable |
| 34 | Rebate/Incentive for Early Payment (₹)    | 0.25–1% rebate at some DISCOMs |
| 35 | Net Metering Credit (₹/kWh)               | Solar ROI tracking |
| 36 | Total Amount Due (₹)                      | Core |
| 37 | Bill Date                                 | Timing |
| 38 | Due Date                                  | Late-payment avoidance |
| 39 | Billing Period (days)                     | 45-day vs 30-day bill changes all analysis |
| 40 | Meter Reading (Previous/Current)          | Verify units consumed vs billed |
| 41 | Meter Number & Multiplying Factor         | CT ratio — wrong MF is a common billing error |
| 42 | Load Factor (%)                           | MD vs avg demand ratio — operational efficiency |

---

## B. Cross-Cutting System Modules (6 new)

**B.1 Notification & Alert Engine** — N01 Alert Rules Manager, N02 Notification Preferences,
N03 Alert History & Dashboard, N04 Escalation Rules.
Tables: `alert_rules`, `alert_instances`, `notification_preferences`, `escalation_rules`.

**B.2 Collaboration & Activity** — CL01 Activity Feed, CL02 Comments & Annotations, CL03 Task Manager.
Tables: `activity_log`, `comments`, `tasks`.

**B.3 Document Management System** — DM01 Universal Document Repository, DM02 Document Workflow.
Tables: `documents`, `document_versions`, `document_approvals`.

**B.4 Localisation & Multi-Language** — ML01 Language Settings (English + Hindi + Tamil/Telugu/Marathi/Kannada/Bengali; multi-script OCR; localised date/number formats).

**B.5 Gamification & Engagement** — G01 Leaderboard, G02 Rewards & Incentives.

**B.6 Mobile App Spec** — mobile-critical/offline pages: FM (O02, O03, O09), Auditor (A04),
Collection Agent (L03, L04, L08), Tenant (H07), All (N03, CL03).

---

## C. Database Tables (61 total = 42 original + 19 new)

New tables: `alert_rules`, `alert_instances`, `notification_preferences`, `escalation_rules`,
`activity_log`, `comments`, `tasks`, `documents`, `document_approvals`, `weather_data`,
`occupancy_data`, `diesel_purchases`, `refrigerant_log`, `employee_commute_surveys`,
`ev_charging_sessions`, `demand_response_events`, `state_regulations`, `benchmarks`, `subscriptions`.

(`document_versions` is implied by the DMS module; track during schema design.)

---

## D. New Pages (23) + 12 cross-cutting module pages

- **Public/Pre-Login (7):** P13 Privacy/ToS (DPDP Act 2023), P14 Partner/Affiliate, P15 Case Studies,
  P16 FAQ/Help, P17 API Docs, P18 System Status, P19 ROI Calculator.
- **Bill Analysis (3):** B19 DG/Diesel Bill Analyser, B20 Bill Forecast & Budget, B21 Multi-Site Consolidated.
- **Energy Efficiency (3):** E21 Lighting Audit, E22 Building Envelope, E23 Compressed Air System.
- **Carbon & Compliance (4):** C17 CDP Builder, C18 TCFD/TNFD, C19 SDG Mapping, R15 GRI Report Builder.
- **BESS/EV (2):** H13 Microgrid Design Tool, H14 Virtual Power Plant Dashboard.
- **Financial (2):** F09 Budget vs Actual, F10 CAPEX Approval Workflow.
- **O&M (2):** O11 Instrument Calibration Manager, O12 Safety Incident Register.
- **Analytics (1):** D07 Executive Summary Dashboard.

---

## E. Personas (12 total)

10 original + **Persona 11: CFO/Finance Head (FH)** (investment decision-maker; F01–F10, E12, R01, D01)
+ **Persona 12: C-Suite/CEO (CS)** (Net Zero, ESG, board dashboards; C14, R02, R13, D01, C19, D07).

---

## F. New User Flows (6)

1. CFO CAPEX Approval. 2. Multi-Building Onboarding (franchise/chain). 3. Seasonal Analysis & Weather
Normalisation. 4. End-to-End Open Access Journey. 5. Data Migration from existing systems.
6. CEO Quarterly Board Presentation.

---

## G. Product Features (5)

1. Automated Tariff Database Updates. 2. Bill Anomaly Detection (ML). 3. Reverse Auction Module.
4. White-Label / Partner Portal. 5. Data Quality Dashboard.

---

## H. Data Architecture Decisions

- **H.1 Relationships:** explicit FKs (orgs→buildings→zones/bills/equipment→devices/maintenance;
  ghg_inventory auto-calc from electricity_bills/diesel_purchases/refrigerant_log; tasks auto-created
  from alerts/audit findings/retrofit recommendations).
- **H.2 Retention:** interval data (~35k records/meter/yr), bills 7yr min, documents outlive building,
  DPDP Act right-to-deletion.
- **H.3 Multi-tenancy:** **multi-tenant with PostgreSQL row-level security** + per-org blob storage (recommended).
- **H.4 Processing split:** real-time (<1min: BMS/IoT/EV/alerts), near-real-time (1–15min: interval/meter),
  batch (daily/weekly: bills/reports/benchmarks), on-demand (audits/BRSR/projections).

---

## Module List (19 modules, 203 pages)

| #  | Module                          | Pages | Notes |
| -- | ------------------------------- | ----- | ----- |
| 0  | Public/Pre-Login                | 19    | +7 |
| 1  | Bill Analysis & Diagnostics     | 21    | +3 |
| 2  | Energy Efficiency Engine        | 23    | +3 |
| 3  | Carbon Trading & IEX            | 19    | +3 |
| 4  | Energy Audit SaaS               | 14    | — |
| 5  | Collection Agent                | 10    | — |
| 6  | BESS, EV & DG                   | 14    | +2 |
| 7  | Compliance & Reporting          | 15    | +1 |
| 8  | Procurement & Marketplace       | 12    | — |
| 9  | Financial Services              | 10    | +2 |
| 10 | Operations & Maintenance        | 12    | +2 |
| 11 | Training Academy                | 6     | — |
| 12 | Analytics & BI                  | 7     | +1 |
| 13 | Admin Panel                     | 9     | — |
| 14 | Notification & Alert Engine     | 4     | NEW |
| 15 | Collaboration & Activity        | 3     | NEW |
| 16 | Document Management             | 2     | NEW |
| 17 | Localisation                    | 1     | NEW |
| 18 | Gamification                    | 2     | NEW |
|    | **TOTAL**                       | **203** | |

---

## Phase 2 (planned, not yet started)

1. Backend microservices architecture. 2. Integration layer (BMS, smart meters, IEX, ICM, DISCOM APIs,
payment gateways, OCR/AI). 3. Asset inventory (icons, illustrations, templates, calculation engines).
4. Security & DPDP Act compliance architecture. 5. Tech stack recommendation. 6. 18-month sprint roadmap.
7. Testing matrix for all 230 screens.
