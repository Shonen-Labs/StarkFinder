use axum::http::StatusCode;
use axum_test::TestServer;
use serde_json::{Value, json};
use sqlx::PgPool;

use backend::libs::db::AppState;

// Keep tuple shapes readable in tests (addresses clippy::type_complexity)
type GeneratedContractRow = (
    i64,                           // id
    i64,                           // user_id
    String,                        // contract_type
    String,                        // contract_name
    Option<String>,                // description
    Option<serde_json::Value>,     // parameters
    Option<String>,                // template_id
    String,                        // status
    chrono::DateTime<chrono::Utc>, // created_at
    chrono::DateTime<chrono::Utc>, // updated_at
);

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

    let raw_wallet = format!("0x{:040x}", timestamp);
    let wallet = backend::libs::wallet::normalize_and_validate(&raw_wallet)
        .expect("Failed to normalize wallet");

    let user_id: (i64,) = sqlx::query_as("INSERT INTO users (wallet) VALUES ($1) RETURNING id")
        .bind(&wallet)
        .fetch_one(pool)
        .await
        .expect("Failed to create test user");

    user_id.0
}

// Test helper to clean up test data
async fn cleanup_test_data(pool: &PgPool) {
    // Delete in correct order due to foreign key constraints
    sqlx::query("DELETE FROM generated_contracts")
        .execute(pool)
        .await
        .ok();
    sqlx::query("DELETE FROM profiles").execute(pool).await.ok();
    sqlx::query("DELETE FROM users").execute(pool).await.ok();
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
    let db_contract: GeneratedContractRow = sqlx::query_as(
        "SELECT id, user_id, contract_type, contract_name, description, parameters, template_id, status, created_at, updated_at FROM generated_contracts WHERE id = $1"
    )
    .bind(response_body["contract_id"].as_i64().unwrap())
    .fetch_one(&pool)
    .await
    .expect("Contract should exist in database");

    assert_eq!(db_contract.1, user_id); // user_id
    assert_eq!(db_contract.2, "token"); // contract_type
    assert_eq!(db_contract.3, "MyToken"); // contract_name

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
    let contract_count: (Option<i64>,) =
        sqlx::query_as("SELECT COUNT(*) FROM generated_contracts WHERE user_id = $1")
            .bind(user_id)
            .fetch_one(&pool)
            .await
            .expect("Should count contracts");

    assert_eq!(contract_count.0, Some(2));

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
    let (server, pool) = create_test_server().await;

    let request_body = json!({
        "contract_type": "token",
        "contract_name": "MyToken"
    });

    let response = server.post("/generate").json(&request_body).await;

    // This should fail due to missing user_id field
    assert_eq!(response.status_code(), StatusCode::UNPROCESSABLE_ENTITY);

    cleanup_test_data(&pool).await;
}

// Test helper to create JWT token for a wallet
fn create_jwt_token(wallet: &str) -> String {
    let secret = backend::libs::jwt::secret_from_env();
    backend::libs::jwt::encode(wallet, &secret).unwrap()
}

// Test helper to create a test user with profile
async fn create_test_user_with_profile(pool: &PgPool) -> (i64, String) {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let raw_wallet = format!("0x{:040x}", timestamp);
    let wallet = backend::libs::wallet::normalize_and_validate(&raw_wallet)
        .expect("Failed to normalize wallet");

    let user_id: (i64,) = sqlx::query_as("INSERT INTO users (wallet) VALUES ($1) RETURNING id")
        .bind(&wallet)
        .fetch_one(pool)
        .await
        .expect("Failed to create test user");

    // Create profile
    sqlx::query("INSERT INTO profiles (user_id, referral_code) VALUES ($1, $2)")
        .bind(user_id.0)
        .bind(format!("REF{}", user_id.0))
        .execute(pool)
        .await
        .ok();

    (user_id.0, wallet)
}

#[tokio::test]
async fn test_list_generated_contracts_success() {
    let (server, pool) = create_test_server().await;
    let (user_id, wallet) = create_test_user_with_profile(&pool).await;

    // Create some test contracts
    let contract_data = vec![
        (
            "token",
            "MyToken",
            Some("A test token"),
            Some(json!({"symbol": "MTK"})),
        ),
        ("nft", "MyNFT", None, None),
        (
            "custom",
            "CustomContract",
            Some("Custom implementation"),
            Some(json!({"version": "1.0"})),
        ),
    ];

    let mut created_contracts = Vec::new();

    for (contract_type, contract_name, description, parameters) in contract_data {
        let request_body = json!({
            "user_id": user_id,
            "contract_type": contract_type,
            "contract_name": contract_name,
            "description": description,
            "parameters": parameters
        });

        let response = server.post("/generate").json(&request_body).await;
        assert_eq!(response.status_code(), StatusCode::CREATED);

        let contract: Value = response.json();
        created_contracts.push(contract);
    }

    // Test listing contracts
    let token = create_jwt_token(&wallet);
    let response = server
        .get("/generated_contracts")
        .authorization_bearer(&token)
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let response_body: Value = response.json();

    // Verify response structure
    assert!(response_body["items"].is_array());
    let items = response_body["items"].as_array().unwrap();
    assert_eq!(items.len(), 3);

    // Verify contracts are returned in descending order by created_at
    for (i, item) in items.iter().enumerate() {
        assert_eq!(item["user_id"], user_id);
        assert_eq!(
            item["contract_type"],
            created_contracts[2 - i]["contract_type"]
        );
        assert_eq!(
            item["contract_name"],
            created_contracts[2 - i]["contract_name"]
        );
        assert!(item["created_at"].is_string());
        assert!(item["updated_at"].is_string());
    }

    // Verify next_cursor is None when all items fit
    assert!(response_body["next_cursor"].is_null());

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_list_generated_contracts_empty() {
    let (server, pool) = create_test_server().await;
    let (_user_id, wallet) = create_test_user_with_profile(&pool).await;

    // Test listing contracts when user has none
    let token = create_jwt_token(&wallet);
    let response = server
        .get("/generated_contracts")
        .authorization_bearer(&token)
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let response_body: Value = response.json();

    // Verify empty response
    assert!(response_body["items"].is_array());
    let items = response_body["items"].as_array().unwrap();
    assert_eq!(items.len(), 0);
    assert!(response_body["next_cursor"].is_null());

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_list_generated_contracts_pagination() {
    let (server, pool) = create_test_server().await;
    let (user_id, wallet) = create_test_user_with_profile(&pool).await;

    // Create 5 test contracts
    for i in 0..5 {
        let request_body = json!({
            "user_id": user_id,
            "contract_type": "token",
            "contract_name": format!("Token{}", i)
        });

        let response = server.post("/generate").json(&request_body).await;
        assert_eq!(response.status_code(), StatusCode::CREATED);
    }

    // Test pagination with limit 2
    let token = create_jwt_token(&wallet);
    let response = server
        .get("/generated_contracts?limit=2")
        .authorization_bearer(&token)
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);

    let response_body: Value = response.json();
    let items = response_body["items"].as_array().unwrap();
    assert_eq!(items.len(), 2);
    assert!(response_body["next_cursor"].is_string());

    // Test using cursor for next page
    let next_cursor = response_body["next_cursor"].as_str().unwrap();
    let response2 = server
        .get(&format!(
            "/generated_contracts?limit=2&cursor={}",
            next_cursor
        ))
        .authorization_bearer(&token)
        .await;

    assert_eq!(response2.status_code(), StatusCode::OK);

    let response_body2: Value = response2.json();
    let items2 = response_body2["items"].as_array().unwrap();
    assert_eq!(items2.len(), 2);

    // Verify no overlap between pages
    let first_page_ids: Vec<i64> = items
        .iter()
        .map(|item| item["id"].as_i64().unwrap())
        .collect();
    let second_page_ids: Vec<i64> = items2
        .iter()
        .map(|item| item["id"].as_i64().unwrap())
        .collect();

    for id1 in &first_page_ids {
        assert!(!second_page_ids.contains(id1));
    }

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_list_generated_contracts_unauthorized() {
    let (server, _pool) = create_test_server().await;

    // Test without authorization header
    let response = server.get("/generated_contracts").await;
    assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);

    // Test with invalid token
    let response2 = server
        .get("/generated_contracts")
        .authorization_bearer("invalid-token")
        .await;
    assert_eq!(response2.status_code(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_list_generated_contracts_invalid_cursor() {
    let (server, pool) = create_test_server().await;
    let (_user_id, wallet) = create_test_user_with_profile(&pool).await;

    let token = create_jwt_token(&wallet);

    // Test with invalid base64 cursor
    let response = server
        .get("/generated_contracts?cursor=invalid-base64")
        .authorization_bearer(&token)
        .await;

    // Should handle gracefully - either return empty or first page
    assert_eq!(response.status_code(), StatusCode::OK);

    let response_body: Value = response.json();
    assert!(response_body["items"].is_array());

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_list_generated_contracts_limit_bounds() {
    let (server, pool) = create_test_server().await;
    let (user_id, wallet) = create_test_user_with_profile(&pool).await;

    // Create some contracts
    for i in 0..10 {
        let request_body = json!({
            "user_id": user_id,
            "contract_type": "token",
            "contract_name": format!("Token{}", i)
        });

        let response = server.post("/generate").json(&request_body).await;
        assert_eq!(response.status_code(), StatusCode::CREATED);
    }

    let token = create_jwt_token(&wallet);

    // Test minimum limit (should default to 1)
    let response = server
        .get("/generated_contracts?limit=0")
        .authorization_bearer(&token)
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    let response_body: Value = response.json();
    let items = response_body["items"].as_array().unwrap();
    assert!(!items.is_empty());

    // Test maximum limit
    let response2 = server
        .get("/generated_contracts?limit=100")
        .authorization_bearer(&token)
        .await;

    assert_eq!(response2.status_code(), StatusCode::OK);
    let response_body2: Value = response2.json();
    let items2 = response_body2["items"].as_array().unwrap();
    assert!(items2.len() <= 50); // Should be clamped to 50

    cleanup_test_data(&pool).await;
}

#[tokio::test]
async fn test_list_generated_contracts_user_isolation() {
    let (server, pool) = create_test_server().await;

    // Create two users
    let (user1_id, wallet1) = create_test_user_with_profile(&pool).await;
    let (user2_id, wallet2) = create_test_user_with_profile(&pool).await;

    // Create contracts for user1
    for i in 0..3 {
        let request_body = json!({
            "user_id": user1_id,
            "contract_type": "token",
            "contract_name": format!("User1Token{}", i)
        });

        let response = server.post("/generate").json(&request_body).await;
        assert_eq!(response.status_code(), StatusCode::CREATED);
    }

    // Create contracts for user2
    for i in 0..2 {
        let request_body = json!({
            "user_id": user2_id,
            "contract_type": "nft",
            "contract_name": format!("User2NFT{}", i)
        });

        let response = server.post("/generate").json(&request_body).await;
        assert_eq!(response.status_code(), StatusCode::CREATED);
    }

    // Test user1 can only see their contracts
    let token1 = create_jwt_token(&wallet1);
    let response1 = server
        .get("/generated_contracts")
        .authorization_bearer(&token1)
        .await;

    assert_eq!(response1.status_code(), StatusCode::OK);
    let response_body1: Value = response1.json();
    let items1 = response_body1["items"].as_array().unwrap();
    assert_eq!(items1.len(), 3);

    for item in items1 {
        assert_eq!(item["user_id"], user1_id);
        assert_eq!(item["contract_type"], "token");
        assert!(item["contract_name"].as_str().unwrap().starts_with("User1"));
    }

    // Test user2 can only see their contracts
    let token2 = create_jwt_token(&wallet2);
    let response2 = server
        .get("/generated_contracts")
        .authorization_bearer(&token2)
        .await;

    assert_eq!(response2.status_code(), StatusCode::OK);
    let response_body2: Value = response2.json();
    let items2 = response_body2["items"].as_array().unwrap();
    assert_eq!(items2.len(), 2);

    for item in items2 {
        assert_eq!(item["user_id"], user2_id);
        assert_eq!(item["contract_type"], "nft");
        assert!(item["contract_name"].as_str().unwrap().starts_with("User2"));
    }

    cleanup_test_data(&pool).await;
}
