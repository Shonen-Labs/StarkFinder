use axum::{
    Json,
    extract::{Query, State},
};
use serde::{Deserialize, Serialize};
use sqlx::Arguments;
use utoipa::ToSchema;

use crate::libs::{db::AppState, error::ApiError};

#[derive(Debug, Deserialize, ToSchema, utoipa::IntoParams)]
pub struct ReviewsQuery {
    pub company: Option<String>,
    pub tag: Option<String>,
    pub since: Option<chrono::DateTime<chrono::Utc>>, // inclusive
    pub until: Option<chrono::DateTime<chrono::Utc>>, // exclusive
    pub sentiment_min: Option<f32>,
    pub cursor: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ReviewItem {
    pub id: i64,
    pub company: String,
    pub tag: Option<String>,
    pub sentiment: f32,
    pub body: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ReviewsListRes {
    pub items: Vec<ReviewItem>,
    pub next_cursor: Option<String>,
}

type ReviewRow = (
    i64,
    String,
    Option<String>,
    f32,
    String,
    chrono::DateTime<chrono::Utc>,
);

#[utoipa::path(
    get,
    path = "/reviews",
    tag = "reviews",
    params(ReviewsQuery),
    responses(
        (status = 200, description = "List reviews", body = ReviewsListRes),
        (status = 400, description = "Bad request", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn list_reviews(
    State(AppState { pool }): State<AppState>,
    Query(q): Query<ReviewsQuery>,
) -> Result<Json<ReviewsListRes>, ApiError> {
    let limit = q.limit.unwrap_or(20).clamp(1, 50);

    // Decode cursor if provided
    let cursor = match q.cursor.as_deref() {
        Some(s) => crate::libs::pagination::decode_cursor(s),
        None => None,
    };

    // Build dynamic SQL with parameters
    // We keep ordering stable by (created_at DESC, id DESC)
    // Cursor condition: (created_at, id) < (cursor.created_at, cursor.id)
    let mut sql = String::from(
        r#"SELECT id, company, tag, sentiment, body, created_at
            FROM reviews
            WHERE 1=1"#,
    );
    let mut args: sqlx::postgres::PgArguments = sqlx::postgres::PgArguments::default();
    let mut i: i32 = 1;

    if let Some(company) = &q.company {
        sql.push_str(&format!(" AND company = ${}", i));
        args.add(company)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add company arg"))?;
        i += 1;
    }
    if let Some(tag) = &q.tag {
        sql.push_str(&format!(" AND tag = ${}", i));
        args.add(tag)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add tag arg"))?;
        i += 1;
    }
    if let Some(since) = &q.since {
        sql.push_str(&format!(" AND created_at >= ${}", i));
        args.add(since)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add since arg"))?;
        i += 1;
    }
    if let Some(until) = &q.until {
        sql.push_str(&format!(" AND created_at < ${}", i));
        args.add(until)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add until arg"))?;
        i += 1;
    }
    if let Some(sentiment_min) = &q.sentiment_min {
        sql.push_str(&format!(" AND sentiment >= ${}", i));
        args.add(sentiment_min).map_err(|_| {
            crate::libs::error::ApiError::Internal("Failed to add sentiment_min arg")
        })?;
        i += 1;
    }
    if let Some(c) = &cursor {
        // (created_at, id) < (c.created_at, c.id) in DESC order means
        // created_at < c.created_at OR (created_at = c.created_at AND id < c.id)
        sql.push_str(&format!(
            " AND (created_at < ${} OR (created_at = ${} AND id < ${}))",
            i,
            i + 1,
            i + 2
        ));
        args.add(&c.created_at)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add created_at arg"))?;
        args.add(&c.created_at)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add created_at arg"))?;
        args.add(&c.id)
            .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add id arg"))?;
        i += 3;
    }

    sql.push_str(" ORDER BY created_at DESC, id DESC");
    sql.push_str(&format!(" LIMIT ${}", i));
    args.add(&limit)
        .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add limit arg"))?;

    let rows: Vec<ReviewRow> = sqlx::query_as_with(&sql, args)
        .fetch_all(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    let items: Vec<ReviewItem> = rows
        .into_iter()
        .map(
            |(id, company, tag, sentiment, body, created_at)| ReviewItem {
                id,
                company,
                tag,
                sentiment,
                body,
                created_at,
            },
        )
        .collect();

    let next_cursor = items.last().map(|last| {
        let c = crate::libs::pagination::ReviewsCursor {
            created_at: last.created_at,
            id: last.id,
        };
        crate::libs::pagination::encode_cursor(&c)
    });

    Ok(Json(ReviewsListRes { items, next_cursor }))
}
