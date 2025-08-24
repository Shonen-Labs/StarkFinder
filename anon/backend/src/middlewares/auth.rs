use axum::{
    extract::FromRequestParts,
    http::{header, request::Parts},
};

use crate::libs::{error::ApiError, jwt, wallet};

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub wallet: String,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let hdr = parts
            .headers
            .get(header::AUTHORIZATION)
            .ok_or(ApiError::Unauthorized("missing authorization"))?;
        let raw = hdr
            .to_str()
            .map_err(|_| ApiError::Unauthorized("invalid authorization"))?;
        let token = raw
            .strip_prefix("Bearer ")
            .or_else(|| raw.strip_prefix("bearer "))
            .ok_or(ApiError::Unauthorized("invalid scheme"))?;

        // Decode JWT to get the wallet address
        let secret = jwt::secret_from_env();
        let claims =
            jwt::decode(token, &secret).map_err(|_| ApiError::Unauthorized("invalid token"))?;

        // Normalize and validate the wallet from claims
        let wallet = wallet::normalize_and_validate(&claims.sub)
            .map_err(|_| ApiError::Unauthorized("invalid token"))?;

        Ok(AuthUser { wallet })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::Request;

    #[tokio::test]
    async fn extractor_ok_with_valid_bearer_jwt() {
        unsafe { std::env::set_var("JWT_SECRET", "test-secret") };
        let wallet = "0x01"; // valid felt, will normalize
        let token = crate::libs::jwt::encode(wallet, &crate::libs::jwt::secret_from_env()).unwrap();

        let req = Request::builder()
            .uri("/")
            .header(header::AUTHORIZATION, format!("Bearer {}", token))
            .body(())
            .unwrap();
        let (mut parts, _) = req.into_parts();

        let extracted = AuthUser::from_request_parts(&mut parts, &()).await;
        assert!(extracted.is_ok());
        let user = extracted.unwrap();
        assert!(user.wallet.starts_with("0x"));
    }

    #[tokio::test]
    async fn extractor_err_without_header() {
        let req = Request::builder().uri("/").body(()).unwrap();
        let (mut parts, _) = req.into_parts();
        let extracted = AuthUser::from_request_parts(&mut parts, &()).await;
        assert!(matches!(extracted, Err(ApiError::Unauthorized(_))));
    }
}
