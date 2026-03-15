-- V001__init_core_schema.sql
-- Descrição: Criação do schema fundacional do TrueW8 (Users, Preferences, Portfolios, Holdings)

-- 1. Tabela de Utilizadores (Autenticação e Limites)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ocr_limit INT DEFAULT 2 NOT NULL, -- Créditos iniciais gratuitos (Onboarding/Test-drive)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Preferências (Modo Acumulador, Tolerância, Moeda)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    base_currency VARCHAR(3) DEFAULT 'BRL' NOT NULL,
    tolerance_value DECIMAL(10, 2) DEFAULT 10.00 NOT NULL,
    allow_sells BOOLEAN DEFAULT TRUE NOT NULL, -- Se FALSE, ativa o Modo Bastter
    theme VARCHAR(20) DEFAULT 'LIGHT' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Carteiras / Cestas (Portfolios)
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ex: 'FIIs Modal', 'Ações XP', 'Cripto'
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Impede que o utilizador crie duas carteiras com o mesmo nome exato
    CONSTRAINT unique_portfolio_name_per_user UNIQUE (user_id, name)
);

-- 4. Tabela de Custódia (O Ativo dentro da Carteira)
CREATE TABLE user_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    
    ticker VARCHAR(20) NOT NULL,
    brokerage VARCHAR(100) NOT NULL, -- Ex: 'BTG', 'Avenue', 'Binance'
    market VARCHAR(50) NOT NULL,     -- Ex: 'B3', 'NYSE', 'CRYPTO'
    asset_type VARCHAR(50) NOT NULL, -- Ex: 'STOCK', 'FII', 'CRYPTO', 'FIXED_INCOME'
    
    -- Precisão (18,8) vital para criptomoedas
    quantity DECIMAL(18, 8) NOT NULL, 
    average_price DECIMAL(18, 4) NOT NULL,
    
    is_locked BOOLEAN DEFAULT FALSE NOT NULL, -- O "Cadeado" (Cofre)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Impede o mesmo ativo na mesma corretora dentro da MESMA carteira
    CONSTRAINT unique_asset_in_portfolio UNIQUE (portfolio_id, ticker, brokerage)
);

-- Índices de performance para otimizar os carregamentos do Dashboard
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_user_holdings_portfolio_id ON user_holdings(portfolio_id);
CREATE INDEX idx_user_holdings_ticker ON user_holdings(ticker);