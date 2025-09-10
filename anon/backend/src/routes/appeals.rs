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
    libs::{db::AppState, error::ApiError, wallet},
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
pub struct UpdateAppealRequest {
    pub reason: Option<String>,
    pub status: Option<String>,
    pub resolution_note: Option<String>,
}

#[derive(Deserialize, ToSchema, Serialize)]
pub struct GetAppealItems {
    pub appeal_id: i64,
    pub actor: String,
    pub review_id: i64,
    pub reason: String,
    pub status: String,
    pub resolution_note: Option<String>,
    pub created_at: Option<String>,
}
#[derive(Deserialize, ToSchema, Serialize, utoipa::IntoParams)]
pub struct AdminAppealRequest {
    pub status: Option<String>,
    pub reason: Option<String>,
    pub cursor: Option<String>,
    pub limit: Option<i64>,
}

type AdminAppeal = (
    i64,
    String,
    i64,
    String,
    String,
    Option<String>,
    Option<String>,
);

#[derive(Deserialize, ToSchema, Serialize)]
pub struct GetAppealRes {
    items: Vec<GetAppealItems>,
    next_cursor: i64,
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

    let normalized_wallet = wallet::normalize_and_validate(&actor)?;

    sqlx::query!(
        r#"INSERT INTO appeals (actor, review_id, reason, status, resolution_note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id"#,
        normalized_wallet,
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

#[utoipa::path(
    get,
    path = "/appeals/{id}",
    tag = "appeals",
    responses(
        (status = 201, body = GetAppealItems),
        (status = 400, description = "Invalid request", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn get_appeal(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Path(appeal_id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    sqlx::query!(
        r#"SELECT wallet
        FROM users
        WHERE wallet = $1"#,
        wallet
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
    .ok_or(ApiError::NotFound("user not found"))?;

    let appeal: GetAppealItems = sqlx::query_as!(
        GetAppealItems,
        r#"SELECT 
            id as appeal_id, actor, review_id, reason, status, resolution_note, created_at::text
        FROM  appeals
        WHERE id = $1"#,
        appeal_id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
    .ok_or(ApiError::NotFound("appeal not found"))?;

    if wallet == appeal.actor {
        Ok(Json(appeal))
    } else {
        Err(ApiError::Unauthorized("not allowed to view this appeal"))
    }
}

#[utoipa::path(
    get,
    path = "/admin/appeals",
    tag = "appeals",
    params(AdminAppealRequest),
    responses(
        (status = 201, description = "Successfully gets appeals based on params", body = GetAppealRes),
        (status = 400, description = "Invalid request", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn get_admin_appeal(
    State(AppState { pool }): State<AppState>,
    Query(params): Query<AdminAppealRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let limit = params.limit.unwrap_or(20).clamp(1, 50);

    let mut dynamic_sql = String::from(
        r#"SELECT id as appeal_id, actor, review_id, reason, status, resolution_note, created_at::text FROM appeals WHERE 1 = 1"#,
    );

    let mut args: sqlx::postgres::PgArguments = sqlx::postgres::PgArguments::default();
    let mut i: i32 = 1;

    println!("i before {i}");

    if let Some(status) = &params.status {
        dynamic_sql.push_str(&format!(" AND status = ${i}"));
        args.add(status)
            .map_err(|_| ApiError::Internal("Failed to add status args"))?;
        i += 1;
    }

    if let Some(reason) = &params.reason {
        dynamic_sql.push_str(&format!(" AND reason = ${i}"));
        args.add(reason)
            .map_err(|_| ApiError::Internal("Failed to add reason args"))?;
        i += 1;
    }

    if let Some(cursor) = &params.cursor {
        dynamic_sql.push_str(&format!(" AND id > ${i}"));
        args.add(cursor)
            .map_err(|_| ApiError::Internal("Failed to add cursor args"))?;
        i += 1;
    }

    dynamic_sql.push_str(" ORDER BY created_at DESC, id DESC");

    dynamic_sql.push_str(&format!(" LIMIT ${}", i));
    args.add(&limit)
        .map_err(|_| crate::libs::error::ApiError::Internal("Failed to add limit arg"))?;

    let rows: Vec<AdminAppeal> = sqlx::query_as_with(&dynamic_sql, args)
        .fetch_all(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    let items: Vec<GetAppealItems> = rows
        .into_iter()
        .map(
            |(appeal_id, actor, review_id, reason, status, resolution_note, created_at)| {
                GetAppealItems {
                    appeal_id,
                    actor,
                    review_id,
                    reason,
                    status,
                    resolution_note,
                    created_at,
                }
            },
        )
        .collect();

    let next_cursor = items.last().unwrap().review_id;

    Ok(Json(GetAppealRes { items, next_cursor }))
}

#[utoipa::path(
    put,
    path = "/admin/appeals/{id}",
    tag = "appeals",
    request_body = UpdateAppealRequest,
    responses(
        (status = 201, description = "Successfully updates an admin appeal"),
        (status = 400, description = "Invalid request", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn update_admin_appeal(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
    Path(appeal_id): Path<i64>,
    Json(req): Json<UpdateAppealRequest>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::info!("Updating appeal: {}", appeal_id);

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

    let appeal = sqlx::query_as!(
        GetAppealItems,
        r#"SELECT 
            id as appeal_id, actor, review_id, reason, status, resolution_note, created_at::text
        FROM  appeals
        WHERE id = $1"#,
        appeal_id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?
    .ok_or(ApiError::NotFound("appeal not found"))?;

    let reason = req.reason.unwrap_or(appeal.reason);
    let status = req.status.unwrap_or(appeal.status);
    let resolution_note = req
        .resolution_note
        .unwrap_or(appeal.resolution_note.unwrap_or_default());
    println!("details {reason} {status} {resolution_note} {appeal_id}");
    sqlx::query!(
        r#"UPDATE appeals SET reason = $1, status = $2 , resolution_note = $3 WHERE id = $4 "#,
        reason,
        status,
        resolution_note,
        appeal_id
    )
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("❌ Failed to update appeal: {:?}", e);
        crate::libs::error::map_sqlx_error(&e)
    })?;

    Ok(Json("APPEAL UPDATED"))
}
