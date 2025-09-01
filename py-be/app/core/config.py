from pydantic_settings import BaseSettings  


class Settings(BaseSettings):
    PROJECT_NAME: str = "User API"
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"