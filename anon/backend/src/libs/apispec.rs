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
        crate::routes::generate::generate,
        crate::routes::user::me
    ),
    components(
        schemas(
            crate::routes::register::RegisterReq,
            crate::routes::register::RegisterRes,
            crate::routes::generate::GenerateReq,
            crate::routes::generate::GenerateRes,
            crate::routes::user::UserMeRes,
            crate::routes::user::ProfilePublic,
            crate::libs::error::ErrorBody
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "auth", description = "Authentication & registration endpoints"),
        (name = "contracts", description = "Contract generation and management endpoints")
    )
)]
pub struct ApiDoc;
