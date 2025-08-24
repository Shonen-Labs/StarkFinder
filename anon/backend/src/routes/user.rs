use axum::{Json, extract::State};
use serde::Serialize;
use utoipa::ToSchema;

use crate::{
    libs::{db::AppState, error::ApiError},
    middlewares::auth::AuthUser,
};

#[derive(Serialize, ToSchema)]
pub struct ProfilePublic {
    pub referral_code: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct UserMeRes {
    pub id: i64,
    pub wallet: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub profile: Option<ProfilePublic>,
}

#[utoipa::path(
    get,
    path = "/user",
    tag = "auth",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Current user", body = UserMeRes),
        (status = 401, description = "Unauthorized", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn me(
    State(AppState { pool }): State<AppState>,
    AuthUser { wallet }: AuthUser,
) -> Result<Json<UserMeRes>, ApiError> {
    // Fetch user and profile
    let rec = sqlx::query!(
        r#"SELECT u.id, u.wallet, u.created_at, p.referral_code
           FROM users u
           LEFT JOIN profiles p ON p.user_id = u.id
           WHERE u.wallet = $1"#,
        wallet
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    let rec = rec.ok_or(ApiError::NotFound("user not found"))?;

    let profile = rec.referral_code.map(|referral_code| ProfilePublic {
        referral_code: Some(referral_code),
    });

    Ok(Json(UserMeRes {
        id: rec.id,
        wallet: rec.wallet,
        created_at: rec.created_at,
        profile,
    }))
}
