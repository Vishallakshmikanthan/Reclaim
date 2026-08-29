from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "RECLAIM API"
    app_version: str = "0.1.0"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    log_level: str = "INFO"
    repository_backend: str = "postgres"
    database_url: str = "postgresql+psycopg://reclaim:change-me-local@localhost:5432/reclaim"
    demo_merchant_id: str = "merchant_demo"
    recovery_provider: str = "simulated"  # "simulated" | "razorpay_test"
    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None
    razorpay_webhook_secret: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @field_validator("razorpay_key_id")
    @classmethod
    def validate_razorpay_key_id(cls, v: str | None) -> str | None:
        if v:
            clean_v = v.strip()
            if clean_v.startswith("rzp_live_"):
                raise ValueError("CRITICAL SECURITY ERROR: Live Razorpay credentials ('rzp_live_...') are strictly prohibited. RECLAIM runs in TEST MODE only.")
            return clean_v
        return v

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.frontend_origin.split(",") if item.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()

