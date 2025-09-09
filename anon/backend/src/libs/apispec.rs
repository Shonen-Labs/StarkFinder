use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        // Take existing components or default, add security scheme, and put back.
        let mut components = openapi.components.take().unwrap_or_default();
        components.add_security_scheme(
            "bearer_auth",
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("JWT")
                    .build(),
            ),
        );
        openapi.components = Some(components);
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::routes::register::register,
        crate::routes::user::me,
        crate::routes::health::healthz,
        crate::routes::generate::generate_contract,
        crate::routes::generate::list_generated_contracts,
        crate::routes::reviews::list_reviews,
        crate::routes::appeals::create_appeal,
    ),
    components(
        schemas(
            crate::routes::register::RegisterReq,
            crate::routes::register::RegisterRes,
            crate::routes::user::UserMeRes,
            crate::routes::user::ProfilePublic,
            crate::libs::error::ErrorBody,
            crate::routes::health::HealthzResponse,
            // Contracts
            crate::routes::generate::GenerateContractReq,
            crate::routes::generate::GenerateContractRes,
            crate::routes::generate::GeneratedContractItem,
            crate::routes::generate::GeneratedContractsListRes,
            // Reviews
            crate::routes::reviews::ReviewItem,
            crate::routes::reviews::ReviewsListRes,
            // Apeals
            crate::routes::appeals::CreateAppealRequest,
            crate::routes::appeals::GetAppealResponse,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "auth", description = "Authentication & registration endpoints"),
        (name = "contracts", description = "Generated contracts endpoints"),
        (name = "reviews", description = "Reviews listing endpoints"),
        (name = "appeals", description = "Adding an appeal endpoint")
    )
)]
pub struct ApiDoc;
