# Deft Energy Solutions

Web app for Deft Energy Solutions — built with [Next.js](https://nextjs.org) (App Router) and TypeScript.

> **Note:** All code and assets for this project live in this GitHub repository only. Do not keep working copies on local machines as the source of truth — clone, work, push, and clean up.

## Planning docs

- [`docs/SPEC_V1.md`](docs/SPEC_V1.md) — locked V1 product spec (scope: pages, tables, personas, flows)
- [`docs/SPEC_V2.md`](docs/SPEC_V2.md) — locked V2 technical spec (architecture, integrations, stack, testing)
- [`docs/PLAN.md`](docs/PLAN.md) — living build plan (screens-first, minimum-friction)
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — living progress log, updated each session

**Design North Star:** intuitive, simple, minimum friction. Core loop = *upload a bill → instant diagnosis →
quantified savings → one recommended action.* Designed for ~50,000 bills/month and ~5,000 monthly users.

**Build approach:** screens-first — the full UI is built and polished with mock data (scrolling, linking,
loading/empty/error states, responsiveness) behind a stable mock-API seam, then backend, endpoints, and
integrations are wired in without changing the UI.

## Getting started

Requires Node.js 18.18+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Production build                  |
| `npm run start` | Run the production build          |
| `npm run lint`  | Lint the codebase                 |

## Structure

```
app/
  layout.tsx     Root layout + metadata
  page.tsx       Landing page
  globals.css    Global styles
```
