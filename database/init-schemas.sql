-- Создание схем для разных модулей
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS partner_check;
CREATE SCHEMA IF NOT EXISTS secretary;
CREATE SCHEMA IF NOT EXISTS marketing;

-- Настраиваем права доступа
GRANT USAGE ON SCHEMA accounting TO postgres;
GRANT USAGE ON SCHEMA partner_check TO postgres;
GRANT USAGE ON SCHEMA secretary TO postgres;
GRANT USAGE ON SCHEMA marketing TO postgres;

-- Схема бухгалтерии
SET search_path TO accounting;

CREATE TABLE IF NOT EXISTS accounting.transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency CHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    tax_amount DECIMAL(15, 2),
    is_expense_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounting.tax_submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    data JSONB NOT NULL
);

-- Схема проверки контрагентов
SET search_path TO partner_check;

CREATE TABLE IF NOT EXISTS partner_check.counterparties (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    vat_id VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_check.judicial_cases (
    id SERIAL PRIMARY KEY,
    counterparty_id INTEGER REFERENCES partner_check.counterparties(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Схема секретаря
SET search_path TO secretary;

CREATE TABLE IF NOT EXISTS secretary.calendar_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    google_event_id VARCHAR(255),
    summary VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attendees JSONB,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS secretary.knowledge_base (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    content_text TEXT,
    vector_embedding JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS secretary.communication_channels (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    channel_value VARCHAR(255) NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Схема маркетинга
SET search_path TO marketing;

CREATE TABLE IF NOT EXISTS marketing.channels (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    api_credentials JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing.content_topics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing.scheduled_posts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    channel_id INTEGER REFERENCES marketing.channels(id),
    topic_id INTEGER REFERENCES marketing.content_topics(id),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    frequency VARCHAR(50),
    generated_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Возвращаемся к публичной схеме
SET search_path TO public;
