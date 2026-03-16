-- V002__holdings_ciphertext_columns.sql
-- Converte campos sensiveis de holdings para ciphertext (texto opaco)

ALTER TABLE user_holdings
    ALTER COLUMN ticker TYPE TEXT,
    ALTER COLUMN brokerage TYPE TEXT,
    ALTER COLUMN quantity TYPE TEXT,
    ALTER COLUMN average_price TYPE TEXT;

-- Em modo E2EE com IV aleatorio por cifragem, duplicidade semantica nao pode ser validada no servidor.
ALTER TABLE user_holdings
    DROP CONSTRAINT IF EXISTS unique_asset_in_portfolio;
