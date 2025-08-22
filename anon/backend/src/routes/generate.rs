use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::libs::{db::AppState, error::ApiError};

#[derive(Deserialize, ToSchema)]
pub struct GenerateReq {
    pub user_id: i64,
    pub name: String,
    pub source_code: String,
    pub scarb_config: Option<String>,
    pub blockchain: Option<String>,
    pub session_id: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct GenerateRes {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub source_code: String,
    pub scarb_config: Option<String>,
    pub blockchain: Option<String>,
    pub session_id: Option<String>,
    #[schema(value_type = String, format = "date-time")]
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Generate and store a new contract
#[utoipa::path(
    post,
    path = "/generate",
    tag = "contracts",
    request_body = GenerateReq,
    responses(
        (status = 201, description = "Contract generated and stored", body = GenerateRes),
        (status = 400, description = "Invalid request", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn generate(
    State(AppState { pool }): State<AppState>,
    Json(req): Json<GenerateReq>,
) -> Result<impl IntoResponse, ApiError> {
    // Validate input
    if req.name.trim().is_empty() {
        return Err(ApiError::BadRequest("contract name cannot be empty"));
    }
    
    if req.source_code.trim().is_empty() {
        return Err(ApiError::BadRequest("source code cannot be empty"));
    }

    // Verify that the user exists
    let user_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)"
    )
    .bind(req.user_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    if !user_exists {
        return Err(ApiError::BadRequest("user not found"));
    }

    // Insert the contract into the database
    let contract = sqlx::query_as::<_, (i64, i64, String, String, Option<String>, Option<String>, Option<String>, chrono::DateTime<chrono::Utc>)>(
        r#"INSERT INTO contracts (user_id, name, source_code, scarb_config, blockchain, session_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, user_id, name, source_code, scarb_config, blockchain, session_id, created_at"#
    )
    .bind(req.user_id)
    .bind(req.name)
    .bind(req.source_code)
    .bind(req.scarb_config)
    .bind(req.blockchain)
    .bind(req.session_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    Ok((
        StatusCode::CREATED,
        Json(GenerateRes {
            id: contract.0,
            user_id: contract.1,
            name: contract.2,
            source_code: contract.3,
            scarb_config: contract.4,
            blockchain: contract.5,
            session_id: contract.6,
            created_at: contract.7,
        }),
    ))
}
