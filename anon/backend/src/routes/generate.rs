use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing;
use utoipa::ToSchema;

use crate::libs::{db::AppState, error::ApiError};

#[derive(Deserialize, ToSchema)]
pub struct GenerateContractReq {
    pub user_id: i64,
    pub contract_type: String,
    pub contract_name: String,
    pub description: Option<String>,
    pub parameters: Option<serde_json::Value>,
    pub template_id: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct GenerateContractRes {
    pub contract_id: i64,
    pub user_id: i64,
    pub contract_type: String,
    pub contract_name: String,
    pub description: Option<String>,
    pub parameters: Option<serde_json::Value>,
    pub template_id: Option<String>,
    pub generated_code: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Generate a new contract for a user
#[utoipa::path(
    post,
    path = "/generate",
    tag = "contracts",
    request_body = GenerateContractReq,
    responses(
        (status = 201, description = "Contract generated successfully", body = GenerateContractRes),
        (status = 400, description = "Invalid request", body = crate::libs::error::ErrorBody),
        (status = 404, description = "User not found", body = crate::libs::error::ErrorBody),
        (status = 500, description = "Internal error", body = crate::libs::error::ErrorBody)
    )
)]
pub async fn generate_contract(
    State(AppState { pool }): State<AppState>,
    Json(req): Json<GenerateContractReq>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::info!(
        "Generating contract for user_id: {}, type: {}, name: {}",
        req.user_id,
        req.contract_type,
        req.contract_name
    );

    // TODO: Implement the actual contract generation logic
    // For now, we'll create a placeholder implementation

    // Validate user exists
    let user = sqlx::query!("SELECT id FROM users WHERE id = $1", req.user_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| crate::libs::error::map_sqlx_error(&e))?;

    if user.is_none() {
        return Err(ApiError::NotFound("user not found"));
    }

    // Validate required fields
    if req.contract_type.trim().is_empty() {
        return Err(ApiError::BadRequest("contract_type is required"));
    }

    if req.contract_name.trim().is_empty() {
        return Err(ApiError::BadRequest("contract_name is required"));
    }

    // Validate contract_type length
    if req.contract_type.len() > 100 {
        return Err(ApiError::BadRequest(
            "contract_type must be less than 100 characters",
        ));
    }

    // Validate contract_name length
    if req.contract_name.len() > 200 {
        return Err(ApiError::BadRequest(
            "contract_name must be less than 200 characters",
        ));
    }

    // Validate description length if provided
    if let Some(ref desc) = req.description {
        if desc.len() > 1000 {
            return Err(ApiError::BadRequest(
                "description must be less than 1000 characters",
            ));
        }
    }

    // Validate template_id length if provided
    if let Some(ref template_id) = req.template_id {
        if template_id.len() > 100 {
            return Err(ApiError::BadRequest(
                "template_id must be less than 100 characters",
            ));
        }
    }

    // Generate placeholder contract code (this would be replaced with actual generation logic)
    let generated_code = format!(
        r#"// Generated contract: {}
// Type: {}
// Generated at: {}

#[starknet::contract]
mod {} {{
    use starknet::{{get_caller_address, contract_address_const}};

    #[storage]
    struct Storage {{
        // TODO: Add storage variables based on contract type
    }}

    #[external(v0)]
    fn constructor(ref self: ContractState) {{
        // TODO: Add constructor logic
    }}

    // TODO: Add contract-specific functions
}}"#,
        req.contract_name,
        req.contract_type,
        chrono::Utc::now().to_rfc3339(),
        req.contract_name.to_lowercase().replace(" ", "_")
    );

    // Insert the generated contract into the database
    let rec = sqlx::query!(
        r#"
        INSERT INTO generated_contracts (
            user_id, contract_type, contract_name, description, 
            parameters, template_id, generated_code, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING 
            id, user_id, contract_type, contract_name, description,
            parameters, template_id, generated_code, status, created_at, updated_at
        "#,
        req.user_id,
        req.contract_type,
        req.contract_name,
        req.description,
        req.parameters,
        req.template_id,
        generated_code,
        "generated"
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Database error while inserting generated contract: {:?}", e);
        crate::libs::error::map_sqlx_error(&e)
    })?;

    tracing::info!(
        "Successfully generated contract with id: {} for user: {}",
        rec.id,
        req.user_id
    );

    Ok((
        StatusCode::CREATED,
        Json(GenerateContractRes {
            contract_id: rec.id,
            user_id: rec.user_id,
            contract_type: rec.contract_type,
            contract_name: rec.contract_name,
            description: rec.description,
            parameters: rec.parameters,
            template_id: rec.template_id,
            generated_code: rec.generated_code,
            status: rec.status,
            created_at: rec.created_at,
            updated_at: rec.updated_at,
        }),
    ))
}
