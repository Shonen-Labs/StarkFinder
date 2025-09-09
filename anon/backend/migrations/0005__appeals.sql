CREATE TABLE IF NOT EXISTS appeals (
    id BIGSERIAL PRIMARY KEY,

    actor TEXT NOT NULL UNIQUE,

    review_id BIGSERIAL NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,

    reason TEXT NOT NULL,

    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'accepted', 'rejected')) DEFAULT 'open',

    resolution_note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appeals_review_id ON appeals (review_id);

CREATE INDEX idx_appeals_actor ON appeals (actor);

CREATE INDEX idx_appeals_status ON appeals (status);

CREATE INDEX idx_appeals_review_status ON appeals (review_id, status);
