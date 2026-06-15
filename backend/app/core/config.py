import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Nexus Sentinel Backend"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./nexus_sentinel.db"

    # Hindsight Configuration
    HINDSIGHT_API_KEY: str = ""
    HINDSIGHT_PROJECT_ID: str = ""
    HINDSIGHT_BASE_URL: str = "https://api.hindsight.vectorize.io"

    # Groq Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # GitHub Configuration
    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = ""  # optional: owner/repo for CI/CD failure scanning

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
