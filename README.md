# Elster Business Assistant (Multi‑Module SaaS Prototype)

Русский ниже (❖). This repository contains an early prototype of a subscription platform that assists small businesses in Germany through four AI‑augmented modules sharing a unified UI and isolated data slices in PostgreSQL.

## ✨ Current Modules (Status)
| Module | Purpose | Status |
|--------|---------|--------|
| Accounting | Aggregate Stripe transactions, show ELSTER submission status (no tax advice) | UI mock + local data |
| Partner Check | Query & display public info / risk signals for counterparties | UI skeleton (data mocked) |
| Secretary | AI customer support using uploaded docs & channel configs | UI skeleton + mock config |
| Marketing | Plan topics & schedule content drafts | UI mock + mock scheduling |

Admin panel: basic mock for viewing users; no real auth or persistence yet.

## 🛠️ Tech Stack (Prototype Reality)
Frontend:
* React + TypeScript + Vite (dev server: `npm run dev`)
* Styling: simple utility classes / inline; Tailwind NOT yet installed (README previously claimed it)
AI (planned abstraction): OpenAI / Gemini via backend adapter (frontend presently only has a fetch streamer stub in `services/geminiService.ts`).
Backend: placeholder `backend/` directory (files currently incomplete/corrupted; to be rebuilt as FastAPI or Flask SSE service + Postgres).
Database: Planned PostgreSQL (not wired yet).

See architectural spec in `AGENT.md`.

## ⚠️ Disclaimer
No legal, tax, or financial advice is provided. The system only summarizes recorded data. Guardrails described in `AGENT.md` must be enforced server‑side before production.

## 🚀 Getting Started (Frontend Prototype)

### Prerequisites
* Node.js ≥ 18
* npm (or pnpm/yarn) – examples use npm

### Install & Run
```bash
git clone <repo-url>
cd Elster-Stripe-Bot
npm install
npm run dev
```
Open the Vite dev URL (typically `http://localhost:5173`).

### Environment Variables
Create `.env` (frontend) if / when API keys are required. Currently the prototype uses mocked data and does NOT read keys on the client. Future variables (backend oriented):
```
OPENAI_API_KEY=...
GEMINI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
DATABASE_URL=postgresql://user:pass@postgres:5432/app
JWT_SECRET=change_me
``` 
Provide a `.env.example` (TODO) before first backend commit.

### Planned Backend Dev Flow (Upcoming)
1. Implement FastAPI service with `/health` and `/api/{module}/chat` SSE endpoints.
2. Add Docker Compose: `frontend`, `api`, `postgres` (and later `worker`).
3. Introduce migrations (Alembic) + RLS policies.
4. Replace mocks with real DB queries.

> NOTE: The existing `docker-compose.yml` and backend python files appear corrupted; they will be replaced in an upcoming commit.

## 📂 Real Project Structure (Now)
```
AGENT.md
App.tsx
components/ ... (UI screens & icons)
constants.ts (mock data for all modules)
services/ (fetch streaming + secretary config client)
backend/ (placeholder, to be rebuilt)
types.ts (shared TS types)
package.json
```

## 🔄 Module Interaction Concept
Single chat widget switches routing target based on selected module (`Module` enum in `types.ts`). Backend will map module → model + prompt. Per‑module conversation history maintained separately server side.

## 🧱 Next Implementation Milestones
1. Rebuild backend skeleton (FastAPI + SSE streaming).
2. Postgres schema (see Section 14 in `AGENT.md`) + migration scripts.
3. Auth (JWT access/refresh) + admin seeding.
4. Accounting: ingest Stripe webhook events → aggregate revenue + submission log stub.
5. Partner Check: integrate VIES VAT validation + sanctions list ingestion.
6. Secretary: file upload + embedding store (e.g. pgvector) + retrieval augmented responses.
7. Marketing: job scheduler for draft posts; content generation endpoint.
8. Observability: Prometheus metrics + structured logs.
9. Rate limiting & guardrail enforcement (refusal patterns).
10. Replace mocks on frontend with REST + streaming calls.

## ✅ Current Limitations
* No persistence (all data mocked in memory on frontend).
* No auth security (hardcoded admin credentials client side — WILL BE REMOVED).
* No proper backend streaming (frontend expects it, but server absent).
* Corrupted placeholder backend / compose files.
* No tests, linting, or formatting rules yet.

## 🧪 Planned Quality Tooling
* ESLint + Prettier + Husky pre-commit
* Vitest / Jest + React Testing Library
* OpenAPI spec → generated TypeScript client
* CI (GitHub Actions) for lint + test + build + Docker

## 🤝 Contributing (Early Stage)
Not stable for external contributions yet. After backend scaffold, issues & contribution guidelines will be added.

## ❖ Кратко по‑русски
Проект — ранний прототип SaaS с 4 модулями (учёт Stripe для ELSTER, проверка контрагентов, секретарь, маркетинг). Сейчас реализованы только интерфейсы и мок‑данные. Следующий шаг — переписать backend, подключить PostgreSQL, добавить стриминг ответов и изоляцию данных. Подробная спецификация — в `AGENT.md`.

## 📄 License
TBD (выбрать: MIT / Apache-2.0 / Proprietary). До выбора считать закрытым исходным кодом.

## 🗺️ Roadmap Snapshot (Condensed)
See detailed roadmap in `AGENT.md`. Short form:
* MVP backend + auth + accounting stream
* Replace mocks → DB
* Partner & Secretary core features
* Marketing scheduling
* Hardening & compliance

---
For full multi‑module agent design and guardrails read `AGENT.md`.
