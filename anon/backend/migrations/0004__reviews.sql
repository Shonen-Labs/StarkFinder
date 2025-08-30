-- Reviews table and composite indexes for filtered pagination
-- Assumes Postgres

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    tag TEXT,
    sentiment NUMERIC(5,2) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Common filter indexes
-- For listing by time and stable pagination using (created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_reviews_created_at_id_desc
    ON reviews (created_at DESC, id DESC);

-- Filter by company with ordered scan
CREATE INDEX IF NOT EXISTS idx_reviews_company_created_at_id_desc
    ON reviews (company, created_at DESC, id DESC);

-- Filter by tag with ordered scan
CREATE INDEX IF NOT EXISTS idx_reviews_tag_created_at_id_desc
    ON reviews (tag, created_at DESC, id DESC);

-- Optional: company + tag combined
CREATE INDEX IF NOT EXISTS idx_reviews_company_tag_created_at_id_desc
    ON reviews (company, tag, created_at DESC, id DESC);


