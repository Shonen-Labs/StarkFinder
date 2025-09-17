-- Add migration script here
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- Index for finding all bookmarks by user (ordered by recency)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created_at_desc
    ON bookmarks (user_id, created_at DESC);

-- Index for finding users who bookmarked a specific post
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_created_at_desc
    ON bookmarks (post_id, created_at DESC);