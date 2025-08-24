use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // wallet address
    pub exp: usize,  // expiration as UTC timestamp (seconds)
}

pub fn secret_from_env() -> Vec<u8> {
    std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "dev-secret-change-me".to_string())
        .into_bytes()
}

pub fn encode(wallet: &str, secret: &[u8]) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = std::time::SystemTime::now()
        .checked_add(std::time::Duration::from_secs(60 * 60 * 24 * 7)) // 7 days
        .unwrap()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;

    let claims = Claims {
        sub: wallet.to_string(),
        exp,
    };
    jsonwebtoken::encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret),
    )
}

pub fn decode(token: &str, secret: &[u8]) -> Result<Claims, jsonwebtoken::errors::Error> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    let data =
        jsonwebtoken::decode::<Claims>(token, &DecodingKey::from_secret(secret), &validation)?;
    Ok(data.claims)
}
