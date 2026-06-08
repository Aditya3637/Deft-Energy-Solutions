# Deft Energy Solutions

Web app for Deft Energy Solutions — built with [Next.js](https://nextjs.org) (App Router) and TypeScript.

> **Note:** All code and assets for this project live in this GitHub repository only. Do not keep working copies on local machines as the source of truth — clone, work, push, and clean up.

## Planning docs

- [`docs/SPEC_V1.md`](docs/SPEC_V1.md) — locked V1 product spec (scope reference)
- [`docs/PLAN.md`](docs/PLAN.md) — living build plan (minimum-friction, thin vertical slices)
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — living progress log, updated each session

**Design North Star:** intuitive, simple, minimum friction. Core loop = *upload a bill → instant diagnosis →
quantified savings → one recommended action.* Designed for ~50,000 bills/month and ~5,000 monthly users.

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
