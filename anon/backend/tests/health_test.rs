use crate::test_config::TestConfig;
use axum::http::StatusCode;
use axum_test::TestServer;
use backend::libs::db::AppState;
use backend::routes::health::{db_health, health};
use sqlx::PgPool;

async fn create_test_app(pool: PgPool) -> axum::Router {
    axum::Router::new()
        .route("/health", axum::routing::get(health))
        .route("/db/health", axum::routing::get(db_health))
        .with_state(AppState { pool })
}

#[tokio::test]
async fn test_health_endpoint() {
    let app = axum::Router::new().route("/health", axum::routing::get(health));
    let server = TestServer::new(app).unwrap();

    let response = server.get("/health").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: serde_json::Value = response.json();
    assert_eq!(body["status"], "ok");
    assert!(body["timestamp"].is_string());
}

// Test database health endpoint with a mock pool that will fail
#[tokio::test]
async fn test_db_health_failure_mock() {
    // Create a pool with invalid connection string to simulate failure
    let invalid_url = "postgresql://invalid:invalid@localhost:9999/invalid";
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .connect(invalid_url)
        .await
        .expect("Should fail to connect");

    let app = create_test_app(pool).await;
    let server = TestServer::new(app).unwrap();

    let response = server.get("/db/health").await;

    assert_eq!(response.status_code(), StatusCode::SERVICE_UNAVAILABLE);

    let body: serde_json::Value = response.json();
    assert_eq!(body["ok"], false);
    assert!(body["version"].is_null());
    assert!(body["error"].is_string());
    assert_eq!(body["error"], "Database connection failed");
}

// Test database health endpoint with a working pool (requires real database)
#[tokio::test]
#[ignore] // Ignore this test as it requires a real database
async fn test_db_health_success() {
    let config = TestConfig::from_env();
    let pool = config
        .create_pool()
        .await
        .expect("Failed to create test pool");

    let app = create_test_app(pool).await;
    let server = TestServer::new(app).unwrap();

    let response = server.get("/db/health").await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let body: serde_json::Value = response.json();
    assert_eq!(body["ok"], true);
    assert!(body["version"].is_string());
    assert!(body["error"].is_null());

    // Verify version contains PostgreSQL info
    let version = body["version"].as_str().unwrap();
    assert!(version.contains("PostgreSQL"));
}
