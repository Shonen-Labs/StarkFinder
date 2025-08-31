// routes/bookmarks.rs

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use base64::{engine::general_purpose, Engine as _};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{
    libs::{db::AppState, error::ApiError},
    middlewares::auth::AuthUser,
};

#[derive(Serialize, ToSchema)]
pub struct BookmarkResponse {
    pub post_id: i64,
    pub created_at: DateTime<Utc>,
    pub bookmarked: bool,
}

#[derive(Deserialize, ToSchema)]
pub struct BookmarkQuery {
    pub cursor: Option<String>,
    pub limit: Option<i32>,
}

#[derive(Serialize, ToSchema)]
pub struct BookmarksListResponse {
    pub bookmarks: Vec<BookmarkItem>,
    pub next_cursor: Option<String>,
    pub has_more: bool,
}

#[derive(Serialize, ToSchema)]
pub struct BookmarkItem {
    pub post_id: i64,
    pub created_at: DateTime<Utc>,
}

/// Save a post as bookmark
#[utoipa::path(
    post,
    path = "/posts/{id}/bookmark",
    tag = "bookmarks",
    params(
        ("id" = i64, Path, description = "Post ID to bookmark")
    ),
    security(("bearer_auth" = [])),
    responses(
        (status = 201, description = "Post bookmarked successfully", body = BookmarkResponse),
        (status = 409, description = "Post already bookmarked", body = crate::libs::error::ErrorBody),
        (status = 404, description = "Post not found", body = crate::libs::error::ErrorBody),
        (status = 401, description = "Unauthorized", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn bookmark_post(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Path(post_id): Path<i64>,
) -> Result<(StatusCode, Json<BookmarkResponse>), ApiError> {
    // Get user ID from wallet
    let user = sqlx::query!("SELECT id FROM users WHERE wallet = $1", wallet)
        .fetch_optional(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
        .ok_or(ApiError::NotFound("User not found"))?;

    // Check if post exists
    let post_exists = sqlx::query!("SELECT 1 FROM reviews WHERE id = $1", post_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
        .is_some();

    if !post_exists {
        return Err(ApiError::NotFound("Post not found"));
    }

    // Check if already bookmarked
    let already_bookmarked = sqlx::query!(
        "SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2",
        user.id,
        post_id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
    .is_some();

    if already_bookmarked {
        return Err(ApiError::Conflict("Post already bookmarked"));
    }

    // Create bookmark
    let bookmark = sqlx::query!(
        r#"INSERT INTO bookmarks (user_id, post_id, created_at)
           VALUES ($1, $2, NOW())
           RETURNING post_id, created_at"#,
        user.id,
        post_id
    )
    .fetch_one(&pool)
    .await
    let bookmarks = match cursor_timestamp {
        Some(cursor_time) => {
            sqlx::query_as!(
                BookmarkItem,
                r#"SELECT 
                    post_id,
                    created_at
                FROM bookmarks
                WHERE user_id = $1 AND created_at < $2
                ORDER BY created_at DESC
                LIMIT $3"#,
                user.id,
                cursor_time,
                limit
            )
            .fetch_all(&pool)
            .await
        }
        None => {
            sqlx::query_as!(
                BookmarkItem,
                r#"SELECT 
                    post_id,
                    created_at
                FROM bookmarks
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2"#,
                user.id,
                limit
            )
            .fetch_all(&pool)
            .await
        }
    }
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    let response = BookmarkResponse {
        post_id: bookmark.post_id,
        created_at: bookmark.created_at,
        bookmarked: true,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// Remove bookmark from a post
#[utoipa::path(
    delete,
    path = "/posts/{id}/bookmark",
    tag = "bookmarks",
    params(
        ("id" = i64, Path, description = "Post ID to unbookmark")
    ),
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Bookmark removed successfully", body = BookmarkResponse),
        (status = 404, description = "Bookmark not found", body = crate::libs::error::ErrorBody),
        (status = 401, description = "Unauthorized", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn unbookmark_post(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Path(post_id): Path<i64>,
) -> Result<Json<BookmarkResponse>, ApiError> {
    // Get user ID from wallet
    let user = sqlx::query!("SELECT id FROM users WHERE wallet = $1", wallet)
        .fetch_optional(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
        .ok_or(ApiError::NotFound("User not found"))?;

    // Delete bookmark
    let result = sqlx::query!(
        "DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2",
        user.id,
        post_id
    )
    .execute(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("Bookmark not found"));
    }

    let response = BookmarkResponse {
        post_id,
        created_at: Utc::now(),
        bookmarked: false,
    };

    Ok(Json(response))
}

/// Get user's bookmarks with cursor-based pagination
#[utoipa::path(
    get,
    path = "/me/bookmarks",
    tag = "bookmarks",
    params(
        ("cursor" = Option<String>, Query, description = "Cursor for pagination"),
        ("limit" = Option<i32>, Query, description = "Number of bookmarks to return (max 100)")
    ),
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "User bookmarks retrieved successfully", body = BookmarksListResponse),
        (status = 401, description = "Unauthorized", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn get_user_bookmarks(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Query(query): Query<BookmarkQuery>,
) -> Result<Json<BookmarksListResponse>, ApiError> {
    // Get user ID from wallet
    let user = sqlx::query!("SELECT id FROM users WHERE wallet = $1", wallet)
        .fetch_optional(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
        .ok_or(ApiError::NotFound("User not found"))?;

    // Validate and set limit (max 100, default 20)
    let limit = query.limit.unwrap_or(20).min(100).max(1);

    // Parse cursor if provided
    let cursor_timestamp = if let Some(cursor) = query.cursor {
        Some(decode_cursor(&cursor)?)
    } else {
        None
    };

    // Query bookmarks with post details
    let bookmarks = match cursor_timestamp {
        Some(cursor_time) => {
            sqlx::query_as!(
                BookmarkWithPost,
                r#"SELECT 
                    b.post_id,
                    b.created_at,
                    r.title as post_title,
                    r.tag as post_tag,
                    r.body as post_body,
                    r.created_at as post_created_at
                FROM bookmarks b
                JOIN reviews r ON b.post_id = r.id
                WHERE b.user_id = $1 AND b.created_at < $2
                ORDER BY b.created_at DESC
                LIMIT $3"#,
                user.id,
                cursor_time,
                limit
            )
            .fetch_all(&pool)
            .await
        }
        None => {
            sqlx::query_as!(
                BookmarkWithPost,
                r#"SELECT 
                    b.post_id,
                    b.created_at,
                    r.title as post_title,
                    r.tag as post_tag,
                    r.body as post_body,
                    r.created_at as post_created_at
                FROM bookmarks b
                JOIN reviews r ON b.post_id = r.id
                WHERE b.user_id = $1
                ORDER BY b.created_at DESC
                LIMIT $2"#,
                user.id,
                limit
            )
            .fetch_all(&pool)
            .await
        }
    }
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    let has_more = bookmarks.len() as i32 == limit;
    let next_cursor = if has_more && !bookmarks.is_empty() {
        Some(encode_cursor(bookmarks.last().unwrap().created_at))
    } else {
        None
    };

    let response = BookmarksListResponse {
        bookmarks,
        next_cursor,
        has_more,
    };

    Ok(Json(response))
}

// Helper functions for cursor encoding/decoding
fn encode_cursor(timestamp: DateTime<Utc>) -> String {
    let timestamp_str = timestamp.timestamp_micros().to_string();
    general_purpose::URL_SAFE_NO_PAD.encode(timestamp_str.as_bytes())
}

fn decode_cursor(cursor: &str) -> Result<DateTime<Utc>, ApiError> {
    let decoded = general_purpose::URL_SAFE_NO_PAD
        .decode(cursor)
        .map_err(|_| ApiError::BadRequest("Invalid cursor format"))?;

    let timestamp_str = String::from_utf8(decoded)
        .map_err(|_| ApiError::BadRequest("Invalid cursor encoding"))?;

    let timestamp_micros: i64 = timestamp_str
        .parse()
        .map_err(|_| ApiError::BadRequest("Invalid cursor timestamp"))?;

    DateTime::from_timestamp_micros(timestamp_micros)
        .ok_or_else(|| ApiError::BadRequest("Invalid cursor timestamp"))
}