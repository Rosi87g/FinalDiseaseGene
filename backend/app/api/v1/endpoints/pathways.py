from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api import deps
from app.db.models import Pathway
from app.schemas.pathway import PathwayResponse

router = APIRouter()

@router.get("/", response_model=List[PathwayResponse])
def get_pathways(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    return db.query(Pathway).offset(skip).limit(limit).all()

@router.get("/{pathway_id}", response_model=PathwayResponse)
def get_pathway(pathway_id: str, db: Session = Depends(deps.get_db)):
    pathway = db.query(Pathway).filter(Pathway.pathway_id == pathway_id).first()
    if not pathway:
        raise HTTPException(status_code=404, detail="Pathway not found")
    return pathway
