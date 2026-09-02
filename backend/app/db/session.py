# This file sets up the SQLAlchemy database connection and session management for the Disease-Gene Map application, including the engine configuration and a base class for ORM models.
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings
from sqlalchemy import create_engine

# Engine configuration
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for SQLAlchemy v2.0
class Base(DeclarativeBase):
    pass

# Dependency injection generator for endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
