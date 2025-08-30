use crate::libs::db::AppState;
use axum::{Json, http::StatusCode};
use serde::Serialize;
use sqlx::Row;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: String,
}

#[derive(Serialize)]
pub struct DbHealthResponse {
    pub ok: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

pub async fn db_health(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Result<Json<DbHealthResponse>, (StatusCode, Json<DbHealthResponse>)> {
    match sqlx::query("SELECT version() as version")
        .fetch_one(&state.pool)
        .await
    {
        Ok(row) => {
            let version: String = row.get("version");
            Ok(Json(DbHealthResponse {
                ok: true,
                version: Some(version),
                error: None,
            }))
        }
        Err(_) => {
            let error_response = Json(DbHealthResponse {
                ok: false,
                version: None,
                error: Some("Database connection failed".to_string()),
            });
            Err((StatusCode::SERVICE_UNAVAILABLE, error_response))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_health_response() {
        let response = health().await;
        let body: serde_json::Value = serde_json::to_value(response.0).unwrap();

        assert_eq!(body["status"], "ok");
        assert!(body["timestamp"].is_string());
    }

    #[tokio::test]
    async fn test_db_health_response_structure() {
        let response = DbHealthResponse {
            ok: true,
            version: Some("PostgreSQL 15.0".to_string()),
            error: None,
        };

        let body: serde_json::Value = serde_json::to_value(response).unwrap();
        assert_eq!(body["ok"], true);
        assert_eq!(body["version"], "PostgreSQL 15.0");
        assert!(body["error"].is_null());
    }

    #[tokio::test]
    async fn test_db_health_error_response_structure() {
        let response = DbHealthResponse {
            ok: false,
            version: None,
            error: Some("Database connection failed".to_string()),
        };

        let body: serde_json::Value = serde_json::to_value(response).unwrap();
        assert_eq!(body["ok"], false);
        assert!(body["version"].is_null());
        assert_eq!(body["error"], "Database connection failed");
    }
}
