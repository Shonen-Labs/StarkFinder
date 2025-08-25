use sqlx::PgPool;
use std::env;

pub struct TestConfig {
    pub database_url: String,
}

impl TestConfig {
    pub fn from_env() -> Self {
        let database_url = env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
            "postgresql://postgres:postgres@localhost:5432/starkfinder_test".to_string()
        });

        Self { database_url }
    }

    pub async fn create_pool(&self) -> Result<PgPool, sqlx::Error> {
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect(&self.database_url)
            .await?;
        Ok(pool)
    }
}

pub async fn setup_test_database() -> Result<PgPool, Box<dyn std::error::Error>> {
    let config = TestConfig::from_env();
    let pool = config.create_pool().await?;
    Ok(pool)
}

pub async fn cleanup_test_database(pool: &PgPool) -> Result<(), sqlx::Error> {
    // Clean up test data with cascade to handle foreign key constraints
    sqlx::query!(
        r#"
        TRUNCATE TABLE
            generated_contracts,
            profiles,
            users
        RESTART IDENTITY CASCADE
        "#
    )
    .execute(pool)
    .await?;
    Ok(())
}
