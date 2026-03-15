-- Tabela de Usuarios (Core do TrueW8 e controle do PLG)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Pode ser nulo para Social Login
    auth_provider VARCHAR(20) DEFAULT 'LOCAL', -- 'LOCAL', 'GOOGLE', 'APPLE'
    provider_id VARCHAR(255), -- ID unico do Google/Apple
    plan_type VARCHAR(50) DEFAULT 'FREE', -- 'FREE', 'PRO'
    ocr_operations_count INT DEFAULT 0, -- Trava para as 2 operacoes gratuitas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Catalogo Global de Ativos (Tickers unicos)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    market VARCHAR(50) NOT NULL, -- 'B3', 'NASDAQ', 'NYSE'
    type VARCHAR(50) NOT NULL -- 'STOCK', 'REIT', 'ETF', 'BDR'
);

-- Carteiras Recomendadas (As "Pizzas" modelo)
CREATE TABLE model_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    provider VARCHAR(100), -- Ex: 'Rico', 'XP', etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Composicao das Carteiras Recomendadas (Cruzamento Ativo x Peso Alvo)
CREATE TABLE model_portfolio_assets (
    model_portfolio_id UUID REFERENCES model_portfolios(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    target_percentage DECIMAL(5,4) NOT NULL, -- Ex: 0.1500 (15%)
    PRIMARY KEY (model_portfolio_id, asset_id)
);

-- Assinaturas do Usuario (O peso que o usuario da para cada carteira no patrimonio global)
CREATE TABLE user_portfolio_subscriptions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_portfolio_id UUID REFERENCES model_portfolios(id) ON DELETE CASCADE,
    assigned_weight DECIMAL(5,4) NOT NULL, -- Ex: 0.3333 (33.33%)
    PRIMARY KEY (user_id, model_portfolio_id)
);

-- Posicao Atual do Usuario (O que ele tem custodiado na corretora para calcular a diferenca)
CREATE TABLE user_holdings (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    current_quantity DECIMAL(15,4) DEFAULT 0,
    average_price DECIMAL(15,4) DEFAULT 0, -- Opcional para a V1, util no futuro
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, asset_id)
);
