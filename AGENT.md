# MultiModule AI Agent Specification (Elster Business Assistant)

Кратко (RU): Этот документ описывает архитектуру и правила четырёх модульных ИИагентов (Accounting, Partner Check, Secretary, Marketing) для SaaSплатформы ведения бизнеса в Германии. Каждый модуль имеет собственную модель/промпт/доступ к строго изолированной части данных в общей PostgreSQL (multitenant). Никаких индивидуальных налоговых, юридических или финансовых советов  только описание данных и операций системы.

---

## 1. Purpose & Vision
Provide subscription users an integrated workspace to: (1) automate ELSTER reporting from Stripe inflows, (2) assess counterparties using public EU data, (3) operate an AI powered customer support secretary, (4) plan & schedule marketing content. A unified chat widget dynamically routes to the modulespecific agent based on the user's active module context.

## 2. HighLevel Architecture

Containers / services:
1. postgres  single database (schemas для разделения данных каждого модуля).
2. ackend (Flask)  auth, routing, module orchestration, streaming responses (chunked responses).
3. Model containers (Docker контейнеры с моделями Gemini):
    - ccounting-model - для бухгалтерского модуля, доступ к accounting schema
    - partner-check-model - для модуля проверки контрагентов, доступ к partner_check schema
    - secretary-model - для модуля секретаря, доступ к secretary schema
    - marketing-model - для маркетингового модуля, доступ к marketing schema
4. Model layer options:
    - Gemini API в докер-контейнерах для обеспечения конфиденциальности
    - OpenAI API для задач коммуникации с пользователем в секретарском модуле
    - Гибридный подход для секретаря: OpenAI для общения, Gemini для обработки данных
5. Worker / queue (future): асинхронные задачи (ELSTER submission, обогащение данных контрагентов, генерация контента).
6. Object storage (future): файлы базы знаний, маркетинговые медиа.

Chat delivery: Frontend sends POST /api/{module}/chat  backend streams tokens (chunked responses). Single chat widget; module switch resets / forks conversation state.

## 3. MultiSchema Database Design

Database design follows multi-schema approach in PostgreSQL:

- public  shared tables (users, organizations, subscriptions)
- ccounting  tax data, ELSTER submissions, Stripe inflow mapping
- partner_check  supplier validation history, verification data
- secretary  client communications, calendar, tasks, knowledge base
- marketing  content plan, post metrics, draft storage

Each Docker контейнер с моделью имеет доступ ТОЛЬКО к соответствующей схеме данных.

## 4. Module-specific Agents

### 4.1 Accounting Agent (Steuerbot)

**Purpose:** Classify Stripe income for monthly German tax declarations, prepare ELSTER submissions.

**Databases Access:**
- accounting.stripe_transactions (actual Stripe settlement data)
- accounting.tax_mappings (user-approved transaction classifications)
- accounting.client_account_details (business form, tax preferences)

**Agent Capabilities:**
- Analyze Stripe transaction inflows
- Map transactions to German tax categories  
- Project likely taxes / suggest set-asides
- Prepare ELSTER submission XMLs
- Answer German tax basics as they pertain to specific revenue items

### 4.2 Partner Check Agent

**Purpose:** Analyze suppliers and partners for due diligence and risk assessment.

**Databases Access:**
- partner_check.eu_suppliers (enriched supplier DB from public EU data)
- partner_check.risk_checks (evaluations history)
- partner_check.client_partners (client business relationships)

**Agent Capabilities:**
- Analyze company finances and structure
- Verify VAT and company registration status
- Assess supplier reliability from public signals
- Generate standardized due diligence reports
- Detect potential compliance or business risks

### 4.3 Secretary Agent

**Purpose:** Provide intelligent client communication assistance and scheduling.

**Databases Access:**
- secretary.client_communications (email, messages, templates)
- secretary.calendar_events (calendar availability, integrations)
- secretary.tasks (to-dos, follow-ups, deadlines)
- secretary.knowledge_base (client references and wiki)

**Agent Capabilities:**
- Draft email responses to customer inquiries
- Manage schedule and arrange appointments
- Prepare meeting summaries and follow-ups
- Organize to-do lists with prioritization
- Maintain knowledge base of client interactions
- Google Calendar integrations for scheduling

### 4.4 Marketing Agent

**Purpose:** Assist with marketing planning and content creation for client businesses.

**Databases Access:**
- marketing.content_plan (scheduling, themes, campaigns)
- marketing.post_metrics (engagement data by platform)
- marketing.drafts (WIP content pieces)
- marketing.brand_assets (tone, style guides, keywords)

**Agent Capabilities:**
- Generate social media content ideas
- Plan content calendar with scheduling
- Draft posts with SEO / CRM awareness
- Analyze engagement metrics patterns
- Suggest A/B testing variants for posts
- Integrate branding guidelines into content

## 5. Data Isolation & Privacy Model

Each module container is strictly isolated with:
1. Distinct Docker container for each agent/model
2. Database schema-level permissions
3. Conversation context isolation
4. No cross-module data access

Personal user data is never shared outside the Secretary module. Tax and financial data stay within the Accounting module. Marketing data only for Marketing module.

## 6. Responsible AI Guidelines

All agent modules adhere to:
1. No individual tax/legal advice - only describing system data and operations
2. Clear demarcation between factual system data vs agent responses
3. Human review required for ELSTER submissions
4. No PII processing outside authorized modules
5. Alternative non-AI routes for all critical functions

---

 2023 ELSTER-STRIPE-BOT SAAS PLATFORM
