# Customer journey & conversion — design + audit

## The audit (issues found in the delivered build)

| # | Issue | Severity | Status |
| - | ----- | -------- | ------ |
| 1 | **Conversion loop broken.** Every "convert" CTA in the savings result (Save & add to plan, Explore, Talk to an advisor, Save this analysis) pointed to `/login`, a fake magic-link form that dead-ends at "check your inbox". The analyzed bill was lost and there was no path into the live product except the landing's "View the dashboard". | 🔴 Critical | **Fixed** |
| 2 | **~8 silent no-op buttons** (Generate BRSR, Export deck, Award bid, Request quote, Generate NOC, Save changes, training Start/Continue, Save audit) did nothing on click — no feedback. | 🟡 High | **Fixed** |
| 3 | No toast / feedback system existed at all. | 🟡 High | **Fixed** (added) |
| 4 | OCR is simulated. | (known) | Labelled; Stage G |
| 5 | Static avatar/org ("Demo Org / DE"); demo data not personalised to the analysed bill. | 🟠 Medium | Accepted for demo; real at Stage F |
| 6 | Long sidebar (17 items) can overwhelm. | 🟢 Low | Acceptable for an exploratory enterprise app; revisit with grouping |
| 7 | a11y not yet audited with tooling (axe/Lighthouse) — can't run locally. | 🟢 Low | Deferred to Stage H (CI) |

## Principle: explore first, commit later

The fastest conversion for this product is **conviction through exploration, not a signup wall**. The "aha"
(your bill is leaking ₹X/year) must land with zero friction, and the user should flow straight from that
moment into the live workspace to poke around — *before* we ask for anything.

## The journey (now frictionless end-to-end)

```
1. LAND            /                Two doors, no signup:
                                    • "Analyze a bill" (the aha)   • "View the dashboard" (explore live)

2. AHA             /analyze         Upload or "try a sample bill" → instant result:
                                    "You're overpaying ~₹X/year" + all 58 checks. No signup to see it.

3. EXPLORE         /app             From the result, CTAs now lead STRAIGHT into the workspace:
                                    • Top fix → "See it in your dashboard" → /app
                                    • Opportunity → "Explore" → /app/markets
                                    • Footer → "Open your dashboard" → /app
                                    The whole product is open to roam: bills, tasks, alerts, ROI,
                                    markets, assets, compliance, field app. Conviction builds by doing.

4. COMMIT          soft, optional   Only when they want to keep/act:
                                    • "Talk to an advisor" → /login → success now offers
                                      "Continue to your workspace →" /app (no dead end)
                                    • Sign-up is one field (email, magic link), never blocking.
```

Two conversion paths, both frictionless:
- **Self-serve** — explore freely, sign up (email-only) when they want to save/share. Pricing: Free → Pro.
- **Managed (success-based)** — "Talk to an advisor": we file the corrections and only succeed when they do
  (the collection-agent / managed-recovery funnel).

## No silent clicks

Every demo action now gives honest feedback via a toast (`components/ui/toast.tsx`,
`components/ui/demo-button.tsx`) — e.g. "Export queued — board deck ships at Stage G", "Settings saved",
"Audit saved on device". Nothing is a confusing dead click; the user always knows what happened.

## What still gates real conversion (backend work, not journey design)

- Persisting the analysed bill to the account (so the dashboard shows *your* bill, not the demo portfolio) —
  Stage E/F.
- Real auth (magic link actually signs you in) — Stage E.
- Real OCR so any uploaded bill works — Stage G.
These are honestly out of scope for the static demo; the journey *shape* is now correct and frictionless.
