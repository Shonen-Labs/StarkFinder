"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .api.routes import router
from .api.limiter import limiter

app = FastAPI(title="StarkFinder API")

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, limiter.rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router
app.include_router(router, prefix="/api")

# Add OpenAPI tags metadata
app.openapi_tags = [
    {
        "name": "contracts",
        "description": "Operations with smart contracts on the blockchain",
    },
    {
        "name": "users",
        "description": "User registration and management",
    },
]
