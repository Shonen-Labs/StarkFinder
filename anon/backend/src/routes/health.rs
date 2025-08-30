use crate::libs::{db::AppState, error::ApiError};
use axum::{Json, extract::State};
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
}

pub async fn health(
    State(AppState { .. }): State<AppState>,
) -> Result<Json<HealthResponse>, ApiError> {
    Ok(Json(HealthResponse { status: "ok" }))
}
