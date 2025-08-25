use axum::http::StatusCode;
use axum_test::TestServer;
use serde_json::{Value, json};
use sqlx::PgPool;

use backend::libs::db::AppState;

// Test helper to create a test server
async fn create_test_server() -> (TestServer, PgPool) {
    // Use test database URL from environment or default
    let database_url = std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://postgres:postgres@localhost:5432/starkfinder_test".to_string()
    });

    let pool = backend::libs::db::new_pool(&database_url)
        .await
        .expect("Failed to create test database pool");

    // Run migrations
    backend::libs::db::run_migrations(&pool)
        .await
        .expect("Failed to run migrations");

    let state = AppState { pool: pool.clone() };
    let app = backend::create_app(state);

    let server = TestServer::new(app).unwrap();
    (server, pool)
}

// Test helper to create a test user
async fn create_test_user(pool: &PgPool) -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let wallet = format!("0x{:040x}", timestamp);

    let user = sqlx::query!(
        "INSERT INTO users (wallet) VALUES ($1) RETURNING id",
        wallet
    )
    .fetch_one(pool)
    .await
    .expect("Failed to create test user");

    user.id
}

// Test helper to clean up test data
async fn cleanup_test_data(pool: &PgPool) {
    // Delete in correct order due to foreign key constraints
    sqlx::query!("DELETE FROM generated_contracts")
        .execute(pool)
        .await
        .ok();
    sqlx::query!("DELETE FROM profiles")
        .execute(pool)
        .await
        .ok();
    sqlx::query!("DELETE FROM users").execute(pool).await.ok();
}

#[tokio::test]
async fn test_generate_contract_success() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": "MyToken",
        "description": "A test token contract",
        "parameters": {
            "name": "TestToken",
            "symbol": "TTK",
            "decimals": 18
        },
        "template_id": "token_v1"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::CREATED);

    let response_body: Value = response.json();

    // Verify response structure
    assert_eq!(response_body["user_id"], user_id);
    assert_eq!(response_body["contract_type"], "token");
    assert_eq!(response_body["contract_name"], "MyToken");
    assert_eq!(response_body["description"], "A test token contract");
    assert_eq!(response_body["template_id"], "token_v1");
    assert_eq!(response_body["status"], "generated");
    assert!(!response_body["generated_code"].as_str().unwrap().is_empty());
    assert!(response_body["contract_id"].as_i64().unwrap() > 0);

    // Verify data was persisted in database
    let db_contract = sqlx::query!(
        "SELECT * FROM generated_contracts WHERE id = $1",
        response_body["contract_id"].as_i64().unwrap()
    )
    .fetch_one(&pool)
    .await
    .expect("Contract should exist in database");

    assert_eq!(db_contract.user_id, user_id);
    assert_eq!(db_contract.contract_type, "token");
    assert_eq!(db_contract.contract_name, "MyToken");

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_minimal_request() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "simple",
        "contract_name": "SimpleContract"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::CREATED);

    let response_body: Value = response.json();

    // Verify minimal fields work
    assert_eq!(response_body["user_id"], user_id);
    assert_eq!(response_body["contract_type"], "simple");
    assert_eq!(response_body["contract_name"], "SimpleContract");
    assert_eq!(response_body["description"], Value::Null);
    assert_eq!(response_body["parameters"], Value::Null);
    assert_eq!(response_body["template_id"], Value::Null);
    assert_eq!(response_body["status"], "generated");

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_user_not_found() {
    let (server, _pool) = create_test_server().await;

    let request_body = json!({
        "user_id": 99999,
        "contract_type": "token",
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::NOT_FOUND);

    let error_body: Value = response.json();
    assert_eq!(error_body["error"], "user not found");
}

#[tokio::test]
async fn test_generate_contract_missing_contract_type() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::UNPROCESSABLE_ENTITY);

    // When a field is missing from JSON, it returns 422 Unprocessable Entity
    // This is the correct behavior for JSON parsing errors

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_missing_contract_name() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "token"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::UNPROCESSABLE_ENTITY);

    // When a field is missing from JSON, it returns 422 Unprocessable Entity
    // This is the correct behavior for JSON parsing errors

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_empty_contract_type() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "",
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(error_body["error"], "contract_type is required");
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_empty_contract_name() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": ""
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(error_body["error"], "contract_name is required");
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_contract_type_too_long() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let long_contract_type = "a".repeat(101);
    let request_body = json!({
        "user_id": user_id,
        "contract_type": long_contract_type,
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(
        error_body["error"],
        "contract_type must be less than 100 characters"
    );
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_contract_name_too_long() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let long_contract_name = "a".repeat(201);
    let request_body = json!({
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": long_contract_name
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(
        error_body["error"],
        "contract_name must be less than 200 characters"
    );
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_description_too_long() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let long_description = "a".repeat(1001);
    let request_body = json!({
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": "MyToken",
        "description": long_description
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(
        error_body["error"],
        "description must be less than 1000 characters"
    );
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_template_id_too_long() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let long_template_id = "a".repeat(101);
    let request_body = json!({
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": "MyToken",
        "template_id": long_template_id
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(
        error_body["error"],
        "template_id must be less than 100 characters"
    );
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_with_whitespace_only() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "   ",
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);

    let error_body: Value = response.json();
    assert_eq!(error_body["error"], "contract_type is required");
    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_multiple_contracts_same_user() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    // Generate first contract
    let request_body_1 = json!({
        "user_id": user_id,
        "contract_type": "token",
        "contract_name": "FirstToken"
    });

    let response_1 = server.post("/generate").json(&request_body_1).await;

    assert_eq!(response_1.status_code(), StatusCode::CREATED);
    let contract_1: Value = response_1.json();

    // Generate second contract
    let request_body_2 = json!({
        "user_id": user_id,
        "contract_type": "nft",
        "contract_name": "MyNFT"
    });

    let response_2 = server.post("/generate").json(&request_body_2).await;

    assert_eq!(response_2.status_code(), StatusCode::CREATED);
    let contract_2: Value = response_2.json();

    // Verify both contracts exist and are different
    assert_ne!(contract_1["contract_id"], contract_2["contract_id"]);
    assert_eq!(contract_1["user_id"], contract_2["user_id"]);
    assert_eq!(contract_1["user_id"], user_id);

    // Verify both contracts are in database
    let contract_count = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM generated_contracts WHERE user_id = $1",
        user_id
    )
    .fetch_one(&pool)
    .await
    .expect("Should count contracts");

    assert_eq!(contract_count, Some(2));

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_generated_code_structure() {
    let (server, pool) = create_test_server().await;
    let user_id = create_test_user(&pool).await;

    let request_body = json!({
        "user_id": user_id,
        "contract_type": "custom",
        "contract_name": "CustomContract"
    });

    let response = server.post("/generate").json(&request_body).await;

    assert_eq!(response.status_code(), StatusCode::CREATED);

    let response_body: Value = response.json();
    let generated_code = response_body["generated_code"].as_str().unwrap();

    // Verify the generated code contains expected elements
    assert!(generated_code.contains("#[starknet::contract]"));
    assert!(generated_code.contains("mod customcontract"));
    assert!(generated_code.contains("struct Storage"));
    assert!(generated_code.contains("fn constructor"));
    assert!(generated_code.contains("CustomContract"));
    assert!(generated_code.contains("custom"));

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_generate_contract_invalid_json() {
    let (server, _pool) = create_test_server().await;

    let response = server
        .post("/generate")
        .json(&json!({"invalid": "json"}))
        .await;

    assert_eq!(response.status_code(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn test_generate_contract_missing_user_id() {
    let (server, _pool) = create_test_server().await;

    let request_body = json!({
        "contract_type": "token",
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    // This should fail due to missing user_id field
    assert_eq!(response.status_code(), StatusCode::UNPROCESSABLE_ENTITY);
}
