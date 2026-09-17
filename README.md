# Round2-Decoders
# ProspectIQ — AI Decision Intelligence Platform for Enterprise Sales

![ProspectIQ](image.png)

ProspectIQ turns scattered company research into an evidence-backed, human-approved
outreach plan. A supervised multi-agent pipeline ingests whatever you give it — a
company brief, notes, a website — extracts structured knowledge, builds a buyer
persona, scores intent, drafts a sales strategy, and then runs that strategy back
through a **Guardrail agent** that checks every claim against the source evidence
before anything is allowed to reach a prospect's inbox.

> **Autonomous Account-Based Marketing Strategy & Outreach Orchestrator** —
> NexBuildOn Hack 2026, Domain 4: Agentic AI — Team Decoders

---

## What it actually does

1. **Research → Knowledge** — free-form text, notes, or a URL go into a
   knowledge-extraction agent that pulls out company facts, decision-makers,
   pain points, and buying signals. `ResearchAgentV2` runs autonomous web/news
   research from the Workspace chat, producing real, cited evidence sources.
2. **Persona & Intent** — dedicated agents build a buyer persona and score
   purchase intent / buying stage from that knowledge.
3. **Strategy** — a strategy agent turns persona + intent into a recommended
   next action and messaging angle.
4. **Guardrail** — every claim in the strategy is checked against the
   underlying evidence. Unsupported claims get flagged, a risk level is
   assigned, and unverified strategies are **blocked from outreach** until a
   human reviews them.
5. **Evidence-driven outreach purpose** — the Recommendation Center scores
   which outreach purpose (Sales, Product Demo, Partnership, Sponsorship,
   Decision-Maker Intro, etc.) is actually supported by an account's real
   evidence, surfaces exactly one **recommended** purpose plus any other
   valid options, and lets the user pick before a draft is generated — the
   chosen purpose reshapes the generated subject/body, it isn't decorative.
6. **Human-approved outreach** — approved strategies are turned into an
   outreach draft (email/LinkedIn/call script), edited, approved, and sent —
   currently wired through Gmail — with every step recorded in a queryable
   **audit trail**. Nothing is ever sent without an explicit human approval.

A Supervisor/Router layer sits in front of the pipeline: free-form chat in the
Workspace is planned and routed to either the sales-analysis pipeline (for
company briefs) or a general research agent (for everything else), streaming
live step-by-step progress back to the UI over SSE.

---

## Architecture

```
                              ┌─────────────────────┐
   User (Workspace chat) ───▶│  Supervisor / Router │
                              └──────────┬───────────┘
                                         │
                     ┌───────────────────┼────────────────────┐
                     ▼                                        ▼
          ┌─────────────────────┐                 ┌───────────────────┐
          │  Sales Analysis      │                 │   Research Agent   │
          │  Pipeline             │                 │  (general Q&A /    │
          │                       │                 │   web lookups)     │
          │  Knowledge Ingestion  │                 └───────────────────┘
          │        │              │
          │        ▼              │
          │  Persona Agent        │
          │        │              │
          │        ▼              │
          │  Intent Agent         │
          │        │              │
          │        ▼              │
          │  Strategy Agent       │
          │        │              │
          │        ▼              │
          │  Guardrail Agent ─────┼──▶ approved? ──▶ Recommendation Center
          │  (evidence check,     │        │          (purpose selection)
          │   risk scoring)       │        │                │
          └───────────────────────┘        │                ▼
                     │                      │          Outreach Queue ──▶ Gmail
                     ▼                      ▼                (human approval
              Audit Trail (Postgres)   blocked ──▶            required to send)
                                        human review
                                        required
```

Each agent is a focused class that makes its own LLM call, parses a structured
JSON response (with safe fallbacks if parsing fails), and persists its output
to Postgres against the company/analysis record — so every screen in the
frontend (Executive Brief, Audit Trail, Accounts, Recommendation Center) reads
from the same real analysis history instead of a separate mock layer.

---

## Tech stack

**Backend**
- FastAPI + SQLAlchemy + PostgreSQL (Alembic migrations)
- JWT authentication + Google OAuth login
- Multi-LLM router with adapters for Groq, Gemini, OpenRouter, and self-hosted
  models (vLLM/Ollama) — no single-provider lock-in
- Server-Sent Events (`/executor/stream`) for live agent progress in the UI
- Gmail integration for sending approved outreach drafts

**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Radix-based UI primitives (shadcn/ui style)
- `@react-oauth/google` for Google sign-in, styled to match the app's
  near-black, thin-border design language
- Framer Motion, React Flow (Relationship Graph), Recharts (Accounts
  dashboards), cmdk (⌘K command palette)

---

## Project structure

```
backend/
  app/
    agents/            knowledge_ingestion, persona, intent, strategy, guardrail,
                        research_agent, research_v2, sales_analysis_agent
    api/                auth, knowledge, persona, intent, strategy, guardrail,
                        assistant, analysis, workspace, queue, audit, supervisor,
                        executor, planner, router, memory, llm, tools, upload,
                        website, agents, enrichment, health
    models/             User, Company, AnalysisResult, OutreachDraft,
                        ConnectedAccount, KnowledgeSource, OAuthState, ...
    pipeline/           prospect_pipeline.py — chains the five core agents
    supervisor/         plans + routes free-form prompts to the right agent
    main.py
  alembic/               migrations
  requirements.txt

Frontend/
  app/
    (app)/              authenticated shell: workspace, accounts, accounts/[id],
                         graph, recommendations, queue, audit, profile
    login/ signup/ forgot-password/
  components/
    workspace/           chat panel, executive brief, guardrail verdict, prompt composer
    recommendations/      recommendation-card.tsx — purpose selector, evidence links
    accounts/ audit/ queue/ graph/ layout/ auth/ ui/
  services/               api-client + one service per domain (workspace, accounts,
                           queue, auth, recommendations, audit) — real fetch calls,
                           no mock layer except a demo-only fallback in accounts.service.ts
  lib/ hooks/ types/
```

---

## Running it locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create a `.env` in `backend/` with, at minimum:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/prospectiq
JWT_SECRET_KEY=change-me

# LLM providers — set the ones you use; DEFAULT_PROVIDER selects which
DEFAULT_PROVIDER=groq
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
TAVILY_API_KEY=

# Google OAuth (login + Gmail send)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

See `app/core/config.py` for the full list of supported settings and their
defaults.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:3000. Create `.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Current status

**Built and working:** knowledge extraction → persona → intent → strategy →
guardrail pipeline; Supervisor/Router with live SSE streaming; `ResearchAgentV2`
web research feeding the Workspace; Guardrail evidence checking with risk
scoring and outreach blocking; evidence-driven Recommendation Center (one
recommended outreach purpose + other valid, evidence-supported options, purpose
selection actually reshapes the generated draft); clickable real evidence
source links; Outreach Queue with approve/edit/send via Gmail, gated on
explicit human approval; Google Login (styled to match the app's design
system); Audit Trail backed by real analysis history; Workspace chat, Accounts
dashboard, Relationship Graph.

**In progress:** meeting scheduling (best-time suggestions, calendar slots) is
wired on the frontend ahead of the corresponding backend endpoints.

**Not yet built:** HubSpot/CRM integrations, WhatsApp/Twilio outreach
channels, and the Kubernetes/Temporal/Kafka production-scale infrastructure
described in the pitch deck — the current prototype runs as a single FastAPI
service + Next.js app.

---

## Team

Nikita Mishra · Ranjit Bhardwaj 

## License

Developed for Morrow 1.0 Hackthon. All rights reserved © 2026.
