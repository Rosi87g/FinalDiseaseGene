import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "DiseaseGeneMap API"

    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/disease_gene_map.db"

    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "capacitor://localhost",
        "http://localhost",
        "https://disease-gene-map-h1r2.vercel.app",
    ]

    # Email (Legacy Gmail - not used)
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""
    RESEND_API_KEY: str = ""    

    # Brevo SMTP
    BREVO_SMTP_SERVER: str = "smtp-relay.brevo.com"
    BREVO_SMTP_PORT: int = 587
    BREVO_API_KEY: str = ""
    BREVO_SENDER_NAME: str = "DiseaseGeneMap"
    BREVO_SENDER_EMAIL: str = ""
    BREVO_LOGIN: str = ""
    BREVO_PASSWORD: str = ""

settings = Settings()