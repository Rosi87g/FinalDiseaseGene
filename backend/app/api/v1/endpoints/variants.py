from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.db.models import Variant
from app.schemas.variant import VariantResponse, VariantDetailResponse

router = APIRouter()  # ← this was missing

@router.get("/", response_model=List[VariantResponse])
def get_variants(
    gene_id: Optional[str] = None,
    clinical_significance: Optional[str] = None,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(deps.get_db)
):
    query = db.query(Variant)
    if gene_id:
        query = query.filter(Variant.gene_id == gene_id)
    if clinical_significance:
        query = query.filter(Variant.clinical_significance == clinical_significance)
    return query.offset(skip).limit(limit).all()

@router.get("/{variant_id}", response_model=VariantDetailResponse)
def get_variant(variant_id: str, db: Session = Depends(deps.get_db)):
    variant = db.query(Variant).filter(Variant.variant_id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return variant