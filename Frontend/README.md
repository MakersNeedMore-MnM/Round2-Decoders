# ProspectIQ — Frontend

Production Next.js 15 (App Router) frontend for ProspectIQ, an explainable
multi-agent account intelligence platform.

## Stack

- Next.js 15 (App Router) + TypeScript
- TailwindCSS + shadcn/ui-style component primitives (Radix under the hood)
- Framer Motion for animation
- React Flow for the Relationship Graph
- Recharts for the Accounts dashboards
- cmdk for the global command palette (⌘K / Ctrl+K)
- Custom WebGL backgrounds (`ogl`): Threads (landing hero) + Plasma (available, unused by default)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To build for production:

```bash
npm run build
npm run start
```

## Connecting to the backend

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to your
deployed FastAPI backend. All backend calls go through `services/api-client.ts`,
so once the backend exposes real endpoints for accounts, reports, and outreach,
swap the mock-data-backed functions in `services/accounts.service.ts` and
`services/reports.service.ts` for real `apiFetch` calls — the shapes are
already there.

Today the backend only exposes auth (`/auth/login`, `/auth/register`) and the
three-step knowledge pipeline (`/knowledge/ingest`, `/persona/analyze/{id}`,
`/intent/analyze/{id}`), which `services/reports.service.ts` already chains
via `runFullPipeline()`. The Accounts, Relationship Graph, Outreach Queue, and
Audit Trail screens run on mock data (`lib/mock-data.ts`) until equivalent
endpoints exist.

## Project structure

```
app/                  Routes (App Router)
  page.tsx            Landing page
  login/ signup/ forgot-password/
  (app)/              Authenticated app shell (sidebar + topbar)
    workspace/ accounts/ accounts/[id]/ graph/ queue/ audit/ profile/
components/
  ui/                 shadcn-style primitives
  backgrounds/        Threads, Plasma, Aurora
  layout/             Sidebar, Topbar, AppShell
  command-palette/    ⌘K palette
  landing/ auth/ workspace/ accounts/ report/ graph/ queue/ audit/ profile/
hooks/                use-media-query, use-mounted, use-command-palette
lib/                  utils, constants, mock-data
services/             api-client, auth/accounts/reports services
types/                Shared domain types
```

## Notes

- Inter is loaded via a `<link>` stylesheet in `app/layout.tsx` (not
  `next/font/google`) so the build never depends on network access to Google
  Fonts — it resolves in the browser at runtime instead.
- The Aurora background on non-landing pages is CSS/Framer Motion, not WebGL,
  so it can render behind data-heavy screens (charts, the graph) without
  competing for GPU budget.
- `next.config.ts` sets `eslint.ignoreDuringBuilds: true` since this is a
  design-system-driven build; re-enable once a project-specific ESLint config
  is in place.
