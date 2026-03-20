-- Introduz uma chave de ativo deterministica para validar unicidade sem expor os campos cifrados.

ALTER TABLE user_holdings
    ADD COLUMN IF NOT EXISTS asset_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_holdings_portfolio_asset_key
    ON user_holdings (portfolio_id, asset_key)
    WHERE asset_key IS NOT NULL;