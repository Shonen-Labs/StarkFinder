-- Add status field to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status_created_at_id_desc
    ON reviews (status, created_at DESC, id DESC);

-- Combined index for company + status filtering
CREATE INDEX IF NOT EXISTS idx_reviews_company_status_created_at_id_desc
    ON reviews (company, status, created_at DESC, id DESC);
