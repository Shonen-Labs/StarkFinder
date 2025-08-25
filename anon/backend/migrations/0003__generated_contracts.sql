-- generated_contracts table
CREATE TABLE IF NOT EXISTS generated_contracts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_type TEXT NOT NULL,
    contract_name TEXT NOT NULL,
    description TEXT NULL,
    parameters JSONB NULL,
    template_id TEXT NULL,
    generated_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_contracts_user_id ON generated_contracts(user_id);

-- Create index on contract_type for filtering
CREATE INDEX IF NOT EXISTS idx_generated_contracts_type ON generated_contracts(contract_type);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_generated_contracts_status ON generated_contracts(status);

