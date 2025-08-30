use backend::*;

use axum::{
    Router,
    http::{
        Method, StatusCode,
        header::{AUTHORIZATION, CONTENT_TYPE, LOCATION},
    },
    response::IntoResponse,
    routing::{get, post},
};
use tokio::net::TcpListener;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{DefaultMakeSpan, TraceLayer},
};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[allow(dead_code)]
async fn root_redirect() -> impl IntoResponse {
    (StatusCode::MOVED_PERMANENTLY, [(LOCATION, "/health")])
}

#[tokio::main]
async fn main() {
    // Load .env first so RUST_LOG is respected
    let _ = dotenvy::dotenv();
    // JSON structured logs with RUST_LOG config
    libs::logging::init_tracing();

    let cfg = libs::config::AppConfig::from_env();

    // Database pool + migrations
    let pool = libs::db::new_pool_from_env().await.expect("db pool");
    libs::db::run_migrations(&pool)
        .await
        .expect("migrations failed");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION]);

    // Router
    let app = Router::new()
        .route("/", get(root_redirect))
        .route("/health", get(routes::health::health))
        .route("/register", post(routes::register::register))
        .route("/user", get(routes::user::me))
        .route("/generate", post(routes::generate::generate_contract))
        .route("/reviews", get(routes::reviews::list_reviews))
        // Swagger UI at /docs and OpenAPI JSON at /api-docs/openapi.json
        .merge(SwaggerUi::new("/docs").url(
            "/api-docs/openapi.json",
            crate::libs::apispec::ApiDoc::openapi(),
        ));

    // request-id layers before trace
    let app = middlewares::request_id::add_request_id(app)
        // trace requests (include headers so x-request-id is visible)
        .layer(
            TraceLayer::new_for_http().make_span_with(DefaultMakeSpan::new().include_headers(true)),
        )
        .layer(cors)
        .with_state(libs::db::AppState { pool: pool.clone() });

    let addr = cfg.addr();
    let listener = TcpListener::bind(&addr).await.expect("bind failed");
    tracing::info!("listening on http://{}", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server failed");
}

async fn shutdown_signal() {
    use tokio::signal;

    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        let mut sigterm = signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler");
        sigterm.recv().await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
