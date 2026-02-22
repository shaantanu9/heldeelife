"""Pipeline configuration loaded from environment variables."""

from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
REWRITTEN_DIR = DATA_DIR / "rewritten"
CONFIG_DIR = BASE_DIR / "config"


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Revalidation
    revalidation_secret: str = ""
    site_url: str = "http://localhost:4567"

    # LLM - Ollama
    ollama_base_url: str = "http://localhost:11434"

    # LLM - Claude
    anthropic_api_key: str = ""

    # Pipeline defaults
    pipeline_default_author_id: str = ""
    pipeline_default_status: str = "draft"

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


def get_settings() -> Settings:
    return Settings()


def ensure_dirs() -> None:
    """Create data directories if they don't exist."""
    for d in (DATA_DIR, RAW_DIR, REWRITTEN_DIR):
        d.mkdir(parents=True, exist_ok=True)
