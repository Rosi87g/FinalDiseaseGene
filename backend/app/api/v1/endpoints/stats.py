from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models import (
    Gene,
    Disease,
    Variant,
    Pathway,
    DiseaseGeneAssociation
)

router = APIRouter()

@router.get("/")
def get_stats(
    db: Session = Depends(deps.get_db)
):
    return {
        "genes": db.query(Gene).count(),
        "diseases": db.query(Disease).count(),
        "variants": db.query(Variant).count(),
        "pathways": db.query(Pathway).count(),
        "associations": db.query(DiseaseGeneAssociation).count()
    }