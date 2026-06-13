from fastapi import APIRouter, Depends, HTTPException  # ← add HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models import Publication

router = APIRouter()

@router.get("/")
def get_publications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    return db.query(Publication).offset(skip).limit(limit).all()

@router.get("/{publication_id}")
def get_publication(publication_id: str, db: Session = Depends(deps.get_db)):
    pub = db.query(Publication).filter(
        Publication.publication_id == publication_id
    ).first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    return pub