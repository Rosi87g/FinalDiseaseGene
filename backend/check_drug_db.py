from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Publication
from app.config import settings

# This uses your existing DB configuration
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

pub = db.query(Publication).filter(Publication.publication_id == 'PUB0001').first()
if pub:
    print(f"TITLE: {pub.title}")
    print(f"ABSTRACT: '{pub.abstract}'")
else:
    print("Record not found!")