-- Iteration 2: auth and holdings persistence model

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ocr_limit INT NOT NULL DEFAULT 2;

ALTER TABLE users
    ALTER COLUMN password_hash SET NOT NULL;

-- Replace the old asset-based holdings relation with direct ticker holdings per user.
DROP TABLE IF EXISTS user_holdings;

CREATE TABLE user_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL,
    quantity DECIMAL(19,4) NOT NULL DEFAULT 0,
    average_price DECIMAL(19,4) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_holdings_user_ticker UNIQUE (user_id, ticker)
);

CREATE INDEX idx_user_holdings_user_id ON user_holdings(user_id);
