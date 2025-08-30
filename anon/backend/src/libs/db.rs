use std::time::Duration;

use sqlx::{
    PgPool,
    postgres::{PgConnectOptions, PgPoolOptions},
};
use thiserror::Error;
use tokio::time::sleep;

#[derive(Debug, Error)]
pub enum DbInitError {
    #[error("DATABASE_URL not set")]
    MissingUrl,
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
}

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

pub async fn new_pool_from_env() -> Result<PgPool, DbInitError> {
    let url = std::env::var("DATABASE_URL").map_err(|_| DbInitError::MissingUrl)?;
    new_pool_with_retry(&url).await
}

pub async fn new_pool(database_url: &str) -> Result<PgPool, DbInitError> {
    let opts: PgConnectOptions = database_url.parse().map_err(|_| DbInitError::MissingUrl)?;

    let pool = PgPoolOptions::new()
        .max_connections(
            std::env::var("DB_MAX_CONNECTIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(10),
        )
        .min_connections(
            std::env::var("DB_MIN_CONNECTIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2),
        )
        .acquire_timeout(Duration::from_secs(
            std::env::var("DB_ACQUIRE_TIMEOUT_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
        ))
        .idle_timeout(Some(Duration::from_secs(
            std::env::var("DB_IDLE_TIMEOUT_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(600),
        )))
        .max_lifetime(Some(Duration::from_secs(
            std::env::var("DB_MAX_LIFETIME_SECS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(1800),
        )))
        .connect_with(opts)
        .await?;
    Ok(pool)
}

pub async fn new_pool_with_retry(database_url: &str) -> Result<PgPool, DbInitError> {
    const MAX_RETRIES: u32 = 5;
    const INITIAL_DELAY: Duration = Duration::from_secs(1);

    let mut attempt = 0;
    let mut delay = INITIAL_DELAY;

    loop {
        match new_pool(database_url).await {
            Ok(pool) => {
                tracing::info!("Database connection established successfully");
                return Ok(pool);
            }
            Err(e) => {
                attempt += 1;
                if attempt >= MAX_RETRIES {
                    tracing::error!(
                        "Failed to connect to database after {} attempts: {:?}",
                        MAX_RETRIES,
                        e
                    );
                    return Err(e);
                }

                tracing::warn!(
                    "Database connection attempt {} failed, retrying in {:?}: {:?}",
                    attempt,
                    delay,
                    e
                );
                sleep(delay).await;

                // Exponential backoff with jitter
                delay = Duration::from_secs(
                    (delay.as_secs() * 2).min(30) + (rand::random::<u64>() % 5),
                );
            }
        }
    }
}

pub async fn health_check(pool: &PgPool) -> bool {
    sqlx::query_scalar!("SELECT 1 as one")
        .fetch_one(pool)
        .await
        .is_ok()
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!().run(pool).await
}
