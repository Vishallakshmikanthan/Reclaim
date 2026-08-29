from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "RECLAIM API"
    app_version: str = "0.1.0"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    log_level: str = "INFO"
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")
    @property
    def origins(self) -> list[str]: return [item.strip() for item in self.frontend_origin.split(",") if item.strip()]
@lru_cache
def get_settings() -> Settings: return Settings()
