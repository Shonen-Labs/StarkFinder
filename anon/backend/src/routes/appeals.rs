use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use sqlx::Arguments;
use utoipa::ToSchema;

use crate::{
    libs::{db::AppState, error::ApiError},
    middlewares::auth::AuthUser,
};

#[derive(Deserialize, ToSchema)]
pub struct CreateAppealRequest {
    pub actor: String,
    pub review_id: i64,
    pub reason: String,
    pub status: String,
    pub resolution_note: Option<String>,
}

#[derive(Deserialize, ToSchema)]
pub struct GetAppealResponse {
    pub id: i64,
    pub actor: String,
    pub review_id: i64,
    pub reason: String,
    pub status: String,
    pub resolution_note: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[utoipa::path(
    post,
    path = "/appeals",
    tag = "appeals",
    request_body = CreateAppealRequest,
    responses(
        (status = 201, description = "Appeal created successfully", body = CreateAppealRequest),
        (status = 400, description = "Invalid request", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn create_appeal(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Json(req): Json<CreateAppealRequest>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::info!(
        "Generating appeal for  review_id: {}, reason: {}",
        req.review_id,
        req.reason
    );
    let rec = sqlx::query!(
        r#"SELECT u.id, u.wallet, u.created_at, p.referral_code
           FROM users u
           LEFT JOIN profiles p ON p.user_id = u.id
           WHERE u.wallet = $1"#,
        wallet
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    rec.ok_or(ApiError::NotFound("user not found"))?;

    let actor = req.actor;

    if !(actor == String::from("author") || actor == String::from("owner")) {
        return Err(ApiError::BadRequest("invalid actor"));
    }

    sqlx::query!(
        r#"INSERT INTO appeals (actor, review_id, reason, status, resolution_note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id"#,
        actor,
        req.review_id,
        req.reason,
        req.status,
        req.resolution_note
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("❌ Failed to insert appeal: {:?}", e);
        crate::libs::error::map_sqlx_error(&e)
    })?;

    Ok((StatusCode::CREATED, Json("Appeal created successfully")))
}

pub async fn get_appeal(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Path(appeal_id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {}
