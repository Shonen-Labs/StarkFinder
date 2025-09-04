use axum::http::StatusCode;
use axum_test::TestServer;
use bigdecimal::BigDecimal;
use chrono::Utc;
use serde_json::json;
use sqlx::PgPool;
use std::env;
use std::str::FromStr;

use backend::libs::db::AppState;

fn get_test_db_url() -> String {
    env::var("TEST_DATABASE_URL")
        .unwrap_or_else("postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable")
}

async fn setup_test_db(pool: &PgPool) -> anyhow::Result<()> {
    // Clean up any existing data
    sqlx::query!("DELETE FROM reviews").execute(pool).await?;

    // Reset sequence
    sqlx::query!("ALTER SEQUENCE reviews_id_seq RESTART WITH 1")
        .execute(pool)
        .await?;

    // Insert test data
    let now = Utc::now();
    let company = "test-company";

    // Published review
    sqlx::query!(
        r#"INSERT INTO reviews (company, tag, sentiment, body, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6)"#,
        company,
        Some("tag1"),
        BigDecimal::from_str("0.8").unwrap(),
        "Test review 1",
        now,
        "published"
    )
    .execute(pool)
    .await?;

    // Deleted review
    sqlx::query!(
        r#"INSERT INTO reviews (company, tag, sentiment, body, created_at, status, deleted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
        company,
        Some("tag2"),
        BigDecimal::from_str("0.6").unwrap(),
        "Test review 2",
        now,
        "published",
        Some(now)
    )
    .execute(pool)
    .await?;

    // Draft review
    sqlx::query!(
        r#"INSERT INTO reviews (company, tag, sentiment, body, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6)"#,
        company,
        Some("tag1"),
        BigDecimal::from_str("0.7").unwrap(),
        "Test review 3",
        now,
        "draft"
    )
    .execute(pool)
    .await?;

    // Another company's review
    sqlx::query!(
        r#"INSERT INTO reviews (company, tag, sentiment, body, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6)"#,
        "other-company",
        Some("tag1"),
        BigDecimal::from_str("0.9").unwrap(),
        "Test review 4",
        now,
        "published"
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[tokio::test]
async fn test_get_review_by_id() -> anyhow::Result<()> {
    let pool = sqlx::PgPool::connect(&get_test_db_url()).await?;
    setup_test_db(&pool).await?;

    let app = backend::create_app(AppState { pool });
    let server = TestServer::new(app)?;

    // Test getting a published review
    let response = server.get("/posts/1").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    assert_eq!(body["id"], json!(1));
    assert_eq!(body["company"], json!("test-company"));
    assert_eq!(body["status"], json!("published"));

    // Test getting a deleted review
    let response = server.get("/posts/2").await;
    assert_eq!(response.status_code(), StatusCode::GONE);

    // Test getting a non-existent review
    let response = server.get("/posts/999").await;
    assert_eq!(response.status_code(), StatusCode::NOT_FOUND);

    Ok(())
}

#[tokio::test]
async fn test_list_company_reviews() -> anyhow::Result<()> {
    let pool = sqlx::PgPool::connect(&get_test_db_url()).await?;
    setup_test_db(&pool).await?;

    let app = backend::create_app(AppState { pool });
    let server = TestServer::new(app)?;

    // Test listing published reviews for a company
    let response = server.get("/companies/test-company/posts").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 2); // Published and draft reviews for test-company (excluding deleted)
    assert!(items.iter().any(|item| item["id"] == json!(1))); // Check review 1 exists in results

    // Test with status filter
    let response = server
        .get("/companies/test-company/posts?status=draft")
        .await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 1); // Only draft review
    assert_eq!(items[0]["id"], json!(3));

    // Test with tag filter
    let response = server.get("/companies/test-company/posts?tag=tag1").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 2); // Reviews with tag1 (excluding deleted)
    assert_eq!(items[0]["id"], json!());

    // Test with non-existent company
    let response = server.get("/companies/non-existent/posts").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 0);

    Ok(())
}

#[tokio::test]
async fn test_text_sanitization() -> anyhow::Result<()> {
    let pool = sqlx::PgPool::connect(&get_test_db_url()).await?;

    // Clean up any existing data
    sqlx::query!("DELETE FROM reviews").execute(&pool).await?;

    // Insert a review with HTML content
    let now = Utc::now();
    sqlx::query!(
        r#"INSERT INTO reviews (id, company, tag, sentiment, body, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
        10000,
        "test-company",
        Some("tag1"),
        BigDecimal::from_str("0.8").unwrap(),
        r#"<p>This is <strong>bold</strong> and <script>alert('xss')</script></p><img src="x" onerror="alert(1)"/>"#,
        now,
        "published"
    )
    .execute(&pool)
    .await?;

    let app = backend::create_app(AppState { pool });
    let server = TestServer::new(app)?;

    // Test that HTML is properly sanitized in both endpoints
    let response = server.get("/posts/10000").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    assert_eq!(
        body["body"],
        json!("<p>This is <strong>bold</strong> and </p>")
    );

    let response = server.get("/companies/test-company/posts").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    let body: serde_json::Value = response.json();
    let items = body["items"].as_array().unwrap();
    assert_eq!(
        items[0]["body"],
        json!("<p>This is <strong>bold</strong> and </p>")
    );

    Ok(())
}
