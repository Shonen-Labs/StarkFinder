use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug)]
pub enum ApiError {
    BadRequest(&'static str),
    Unauthorized(&'static str),
    Conflict(&'static str),
    NotFound(&'static str),
    Internal(&'static str),
}

#[derive(Serialize, ToSchema)]
pub struct ErrorBody {
    pub error: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        match self {
            ApiError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorBody {
                    error: msg.to_string(),
                }),
            )
                .into_response(),
            ApiError::Unauthorized(msg) => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorBody {
                    error: msg.to_string(),
                }),
            )
                .into_response(),
            ApiError::Conflict(msg) => (
                StatusCode::CONFLICT,
                Json(ErrorBody {
                    error: msg.to_string(),
                }),
            )
                .into_response(),
            ApiError::NotFound(msg) => (
                StatusCode::NOT_FOUND,
                Json(ErrorBody {
                    error: msg.to_string(),
                }),
            )
                .into_response(),
            ApiError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorBody {
                    error: msg.to_string(),
                }),
            )
                .into_response(),
        }
    }
}

pub fn map_sqlx_error(e: &sqlx::Error) -> ApiError {
    match e {
        sqlx::Error::Database(db) if db.code().as_deref() == Some("23505") => {
            ApiError::Conflict("duplicate")
        }
        _ => ApiError::Internal("database error"),
    }
}
