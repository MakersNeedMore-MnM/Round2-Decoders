from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env"""

    APP_NAME: str = "ProspectIQ"
    APP_VERSION: str = "0.1.0"

    DEBUG: bool = True

    HOST: str = "127.0.0.1"
    PORT: int = 8000

    DEFAULT_PROVIDER: str = "groq"

    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"
    
    APPCONNECTOR_API_KEY: str = ""
    APPCONNECTOR_BASE_URL: str = "https://api.appconnector.pro"


    DATABASE_URL: str

    JWT_SECRET_KEY: str
    
    JWT_ALGORITHM: str = "HS256"
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()