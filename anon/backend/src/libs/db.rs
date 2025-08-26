use std::time::Duration;

use sqlx::{
    PgPool,
    postgres::{PgConnectOptions, PgPoolOptions},
};
use thiserror::Error;

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
    new_pool(&url).await
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

// pub async fn health_check(pool: &PgPool) -> bool {
//     sqlx::query_scalar!("SELECT 1 as one")
//         .fetch_one(pool)
//         .await
//         .is_ok()
// }

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!().run(pool).await
}
