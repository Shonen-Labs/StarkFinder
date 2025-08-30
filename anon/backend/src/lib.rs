pub mod libs {
    pub mod apispec;
    pub mod config;
    pub mod db;
    pub mod error;
    pub mod jwt;
    pub mod logging;
    pub mod wallet;
}

pub mod middlewares {
    pub mod auth;
    pub mod request_id;
}

pub mod routes {
    pub mod generate;
    pub mod health;
    pub mod register;
    pub mod user;
}

use axum::{
    Router,
    http::{
        Method,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    routing::{get, post},
};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{DefaultMakeSpan, TraceLayer},
};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::libs::db::AppState;

pub fn create_app(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION]);

    // Router
    let app = Router::new()
        .route("/register", post(routes::register::register))
        .route("/user", get(routes::user::me))
        .route("/generate", post(routes::generate::generate_contract))
        // Swagger UI at /docs and OpenAPI JSON at /api-docs/openapi.json
        .merge(SwaggerUi::new("/docs").url(
            "/api-docs/openapi.json",
            crate::libs::apispec::ApiDoc::openapi(),
        ));

    // request-id layers before trace
    middlewares::request_id::add_request_id(app)
        // trace requests (include headers so x-request-id is visible)
        .layer(
            TraceLayer::new_for_http().make_span_with(DefaultMakeSpan::new().include_headers(true)),
        )
        .layer(cors)
        .with_state(state)
}
