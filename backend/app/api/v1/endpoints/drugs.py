from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models import DrugTarget

router = APIRouter()

@router.get("/")
def get_drugs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    drugs = db.query(DrugTarget).offset(skip).limit(limit).all()
    return [
        {
            "drug_id":    d.drug_target_id,   # ← actual PK field
            "drug_name":  d.drug_name,
            "target_gene": d.gene_id,          # ← actual field name
            "indication": d.indication,
        }
        for d in drugs
    ]