-- V1__init_core_schema.sql
-- Descrição: Criação do schema fundacional do TrueW8 (Users, Preferences, Holdings)

-- 1. Tabela de Usuários (Autenticação e Limites)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ocr_count INT DEFAULT 2 NOT NULL, -- Limite inicial gratuito para o Gemini
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Preferências (Modo Acumulador, Tolerância, Moeda)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    base_currency VARCHAR(3) DEFAULT 'BRL' NOT NULL,
    tolerance_value DECIMAL(10, 2) DEFAULT 10.00 NOT NULL,
    allow_sells BOOLEAN DEFAULT TRUE NOT NULL, -- Se FALSE, o sistema nunca sugere vendas (Modo Bastter)
    theme VARCHAR(20) DEFAULT 'LIGHT' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Custódia (O "Cofre", Multi-Corretora e Visão Global)
CREATE TABLE user_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    ticker VARCHAR(20) NOT NULL,
    brokerage VARCHAR(100) NOT NULL, -- Ex: 'BTG', 'Avenue', 'Binance'
    market VARCHAR(50) NOT NULL,     -- Ex: 'B3', 'NYSE', 'CRYPTO'
    asset_type VARCHAR(50) NOT NULL, -- Ex: 'STOCK', 'FII', 'CRYPTO', 'FIXED_INCOME'
    
    -- Precisão (18,8) é vital para suportar frações de Criptomoedas (ex: 0.00150000 BTC)
    quantity DECIMAL(18, 8) NOT NULL, 
    average_price DECIMAL(18, 4) NOT NULL,
    
    is_locked BOOLEAN DEFAULT FALSE NOT NULL, -- O "Cadeado" para proteger o ativo do rebalanceamento
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Impede ativos duplicados na mesma corretora para o mesmo usuário
    CONSTRAINT unique_user_asset_brokerage UNIQUE (user_id, ticker, brokerage)
);

-- Índices de performance para as consultas do Dashboard
CREATE INDEX idx_user_holdings_user_id ON user_holdings(user_id);
CREATE INDEX idx_user_holdings_ticker ON user_holdings(ticker);