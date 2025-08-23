# Multi‑Module AI Agent Specification (Elster Business Assistant)

Кратко (RU): Этот документ описывает архитектуру и правила четырёх модульных ИИ‑агентов (Accounting, Partner Check, Secretary, Marketing) для SaaS‑платформы ведения бизнеса в Германии. Каждый модуль имеет собственную модель/промпт/доступ к строго изолированной части данных в общей PostgreSQL (multi‑tenant). Никаких индивидуальных налоговых, юридических или финансовых советов — только описание данных и операций системы.

---

## 1. Purpose & Vision
Provide subscription users an integrated workspace to: (1) automate ELSTER reporting from Stripe inflows, (2) assess counterparties using public EU data, (3) operate an AI powered customer support secretary, (4) plan & schedule marketing content. A unified chat widget dynamically routes to the module‑specific agent based on the user’s active module context.

## 2. High‑Level Architecture

Containers / services:
1. `postgres` – single database (schemas or row‑level scoping per tenant + per module tables).
2. `api-gateway` / backend (FastAPI or Flask) – auth, routing, module orchestration, streaming responses (SSE / chunked JSON lines).
3. Module logic services (optional split or monolith modules):
    - `svc-accounting`
    - `svc-partner-check`
    - `svc-secretary`
    - `svc-marketing`
4. Model layer options:
    - External APIs (OpenAI / Gemini / local models). Abstract via a `ModelProvider` interface; enable feature flags and fallback chain.
5. Worker / queue (future): asynchronous tasks (ELSTER submission, large partner data enrichment, batch content generation, email sending).
6. Object storage (future): knowledge base files, marketing media prompts.

Chat delivery: Frontend sends `POST /api/{module}/chat` → backend streams tokens (SSE: `event: token\n data: {...}\n\n`). Single chat widget; module switch resets / forks conversation state.

## 3. Module Definitions

### 3.1 Accounting (ELSTER Automation)
Goal: Reflect Stripe transactions → aggregate → prepare periodical ELSTER submissions metadata (NO actual tax/legal advice).
Data scope:
* Tables: `transactions`, `submission_logs`, `accounting_settings`.
Allowed AI actions:
* Summaries (period revenue, net vs tax, refunds, VAT collected estimate).
* Status queries for submissions.
* Plain language explanation of recorded data + settings.
Prohibited: personalized tax strategies, legal interpretations, forecasting future tax liabilities.

### 3.2 Partner Check
Goal: Provide factual profile of counterparties using user input identifiers (VAT ID, name, country) + cached public datasets (EU VIES VAT validation, sanctions lists, court notice datasets, credit risk open sources when license permits).
Data scope:
* Tables: `counterparties`, `company_profile` (user company), `partner_checks` (query logs), `risk_signals`.
AI actions: summarize collected open data, highlight risk flags, note last refresh times.
Prohibited: generating unverifiable accusations, guessing missing legal facts, advising contractual clauses.

### 3.3 Secretary
Goal: Omnichannel customer inquiry responder using uploaded docs + channel configs.
Data scope:
* Tables: `channels`, `kb_files`, `kb_chunks`, `secretary_config`, `conversation_threads`, `messages`.
AI actions: answer strictly from knowledge base & prior conversation context, escalate if confidence low, classify intent, draft responses for email / Telegram / Signal / (future) voice.
Prohibited: inventing company policies not present in KB, handling payment details beyond mask, storing PII beyond required retention.

### 3.4 Marketing
Goal: Help plan & generate draft content + schedule posts.
Data scope:
* Tables: `marketing_channels`, `content_topics`, `scheduled_posts`, `generated_assets`.
AI actions: produce title / body / media prompt variants, adapt tone (if provided), schedule suggestions based on simple heuristics (NOT predictive analytics yet).
Prohibited: claims needing regulatory approval, unverifiable statistics, legal compliance guarantees.

## 4. Conversation & Routing Strategy
Single widget recommended (less UI duplication). Routing key = active module in frontend state. Maintain per‑module conversation state server side (separate thread IDs) so user can return and resume contextually. Frontend: one component; backend: conversation manager storing `module`, `user_id`, `messages[]`.

Alternative (deferred): distinct chat panels per module – increases clarity but heavier UI; keep as future A/B.

## 5. Model Abstraction
Interface (pseudo):
```
generate(module, messages, tools?, tenantCtx) -> stream(tokens)
```
Policy order (configurable):
1. Primary (e.g., OpenAI GPT‑4.1 mini / Gemini) per module.
2. Fallback (alternate provider) on timeout / quality threshold.
3. Local model (optional) for privacy / cost fallback when latency budget exceeded.

Per‑module system prompt (template):
* Identity: role + scope boundaries.
* Data policy: “Only use provided structured data rows … If answer outside scope → refusal pattern.”
* Refusal recipe (see §7) with neutral compliance phrasing.
* Output formatting guidelines (concise bullet summaries, disclaimers where needed).

## 6. Data Isolation & Access Control
Multi‑tenant enforcement layers:
1. DB schema: `tenant_id` column on all tenant tables, composite primary keys where sensible.
2. Row Level Security (PostgreSQL RLS) + `SET app.current_tenant` on connection.
3. Service layer: queries always parameterized by `tenant_id` & `module`.
4. Vector / embedding store (if used for Secretary KB) partitioned by tenant namespace.
5. Logging scrubs PII except minimal identifiers.

No cross‑module data leakage: each module receives only sanitized slice needed for its prompt invocation.

## 7. Guardrails & Refusal Policies
General prohibitions (all modules):
* No legal / tax / financial advisory (interpretations, optimization strategies, compliance guarantees).
* No personal data synthesis or deanonymization.
* No unverified external facts (must cite internal data fields or say it lacks info).
* No forward‑looking predictions beyond trivial arithmetic on existing data.

Refusal template (German – default UI language):
> "Ich kann dazu keine steuerliche oder rechtliche Beratung geben. Bitte wenden Sie sich an einen qualifizierten Steuerberater. Ich kann jedoch die vorhandenen Daten im System erläutern – möchten Sie eine Übersicht sehen?"

Escalation (Secretary): if confidence < threshold or missing KB citation → propose handoff and tag ticket.

## 8. Compliance, Privacy, Security
* GDPR: data minimization (store only needed Stripe fields), right to erasure implemented via soft‑delete + background purge.
* Audit log: admin & agent actions (submission generated, file uploaded, post scheduled).
* Secrets: loaded via env (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, etc.) not committed.
* Transport: all external calls TLS; internal container network isolated.
* Rate limiting per user & module to prevent prompt abuse.
* Prompt injection mitigation: sanitize user inputs, delimit structured data, enforce strict refusal rules.

## 9. Admin Capabilities
* View tenants, subscription status, usage metrics (tokens, requests per module).
* Force reindex KB / clear conversations per module.
* Toggle module availability (feature flags).
* Inspect (redacted) message logs for abuse (privacy filters applied).

## 10. Streaming Protocol
Preferred: Server‑Sent Events.
Event types:
* `token` – incremental content.
* `thought` (optional internal debug – disabled in production).
* `error` – terminal error.
* `done` – completion.
Fallback: chunked JSON lines if SSE unsupported.

## 11. Error Handling Contract
Frontend categories: `NETWORK`, `RATE_LIMIT`, `GUARDRAIL_REFUSAL`, `MODEL_FAILURE`, `VALIDATION`.
Server JSON error shape:
```
{ "error": { "code": "RATE_LIMIT", "message": "...", "retry_after": 5 } }
```

## 12. Observability
Metrics (Prometheus): request_count{module}, tokens_out_total{module}, refusal_count{module,reason}, latency_histogram_seconds, model_fallback_count.
Tracing (OTel): spans around model invocation and DB retrieval.
Structured logs (JSON) with correlation id.

## 13. Roadmap Snapshot (Execution Order)
1. Backend bootstrap (auth skeleton + accounting chat echo + SSE).
2. Postgres schema & RLS scaffold.
3. Modular prompt templates & routing layer.
4. Secretary KB ingestion pipeline (embedding + search).
5. Partner Check integration (VIES VAT validation + sanctions dataset ingestion job).
6. Stripe webhook ingestion + accounting aggregation + ELSTER submission stub.
7. Marketing scheduler (cron / worker) + draft generation.
8. Admin dashboard metrics + feature flag control.
9. Hardening: rate limiting, audit, multi‑provider models.
10. CI/CD pipelines & integration tests.

## 14. Minimal Initial Postgres Tables (Draft)
```
tenants(id uuid pk, name, created_at)
users(id uuid pk, tenant_id fk, email, role, password_hash, subscription_status, last_login_at)
transactions(id, tenant_id, stripe_id, amount_cents, currency, type, tax_amount_cents, occurred_at, raw jsonb)
submission_logs(id, tenant_id, period, status, created_at, payload jsonb)
accounting_settings(tenant_id pk, submission_frequency, vat_id, last_sync_at)
company_profile(tenant_id pk, name, vat_id, address, country)
counterparties(id, tenant_id, name, vat_id, country, last_check_at, status, raw jsonb)
partner_checks(id, tenant_id, counterparty_id fk, query_input jsonb, created_at)
channels(id, tenant_id, type, value, connected boolean, created_at)
kb_files(id, tenant_id, file_name, size_bytes, mime, uploaded_at)
kb_chunks(id, file_id fk, embedding vector, content text)
conversation_threads(id, tenant_id, module, created_at, updated_at)
messages(id, thread_id fk, role, content, created_at, token_count)
marketing_channels(id, tenant_id, platform, url, created_at)
content_topics(id, tenant_id, topic, created_at)
scheduled_posts(id, tenant_id, channel_id fk, topic_id fk, scheduled_at, status, generated jsonb)
generated_assets(id, tenant_id, post_id fk, variant, content jsonb)
```

## 15. Security Checklist (MVP)
* Hash passwords (Argon2 / bcrypt), enforce admin creation via migration.
* JWT access + refresh rotation; short lived access tokens.
* RLS policies tested automatically.
* Input validation: Pydantic / schema layer.
* File uploads virus scan (future) + size limits.

## 16. Testing Strategy
* Unit: prompt builder, model provider adapter, RLS enforcement (SQL tests), VAT ID validator.
* Integration: chat endpoint streaming, Stripe webhook ingestion, KB retrieval relevance test.
* Load (later): concurrent chat sessions + rate limiting.

## 17. Open Questions (To Clarify With Product Owner)
1. Required ELSTER submission formats (USt‑VA, Jahreserklärung, etc.) priority order.
2. Minimum partner data sources in first release (only VIES? add sanctions?).
3. Channels for Secretary MVP (email + Telegram?) vs full set.
4. Marketing publishing — actual API posting in MVP or draft export only?
5. Target token cost budget per module (to tune model selection / caching).

## 18. Refusal Examples
User: "Soll ich mich für die Kleinunternehmerregelung entscheiden?" → Refusal template.
User: "Wie viel Umsatzsteuer zahle ich nächstes Jahr?" → Refusal + offer historical summary.
User: "Gib mir die private Adresse des Lieferanten" → Refusal (privacy).

## 19. Summary
This specification defines a modular, secure, compliance‑aware multi‑agent system sharing a unified UX while isolating data and prompts. Next implementation step: scaffold backend + accounting chat stream + per‑module prompt switch.

---
Change Log:
v0.2 (multi‑module expansion) – Added 4‑module architecture, data isolation model, guardrails, roadmap.
