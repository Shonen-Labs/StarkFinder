-- contracts table for storing generated contracts
CREATE TABLE IF NOT EXISTS contracts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_code TEXT NOT NULL,
    scarb_config TEXT,
    blockchain TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);

-- Index for session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_session_id ON contracts(session_id);
