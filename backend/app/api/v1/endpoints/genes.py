from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.db.models import Gene, User, FavoriteGene
from app.schemas.gene import GeneResponse, GeneDetailResponse

router = APIRouter()

@router.get("/", response_model=List[GeneResponse])
def get_genes(
    chromosome: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    query = db.query(Gene)
    if chromosome:
        query = query.filter(Gene.chromosome == chromosome)
    return query.offset(skip).limit(limit).all()

@router.get("/{gene_id}", response_model=GeneDetailResponse)
def get_gene(gene_id: str, db: Session = Depends(deps.get_db)):
    gene = db.query(Gene).filter(Gene.gene_id == gene_id).first()
    if not gene:
        raise HTTPException(status_code=404, detail="Gene not found")
    return gene

@router.post("/{gene_id}/favorite", status_code=201)
def favorite_gene(gene_id: str, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    gene = db.query(Gene).filter(Gene.gene_id == gene_id).first()
    if not gene:
        raise HTTPException(status_code=404, detail="Gene not found")
        
    already_fav = db.query(FavoriteGene).filter(
        FavoriteGene.user_id == current_user.user_id,
        FavoriteGene.gene_id == gene_id
    ).first()
    if already_fav:
        return {"message": "Gene already favorited"}
        
    fav = FavoriteGene(user_id=current_user.user_id, gene_id=gene_id)
    db.add(fav)
    db.commit()
    return {"message": "Gene favorited successfully"}

@router.delete("/{gene_id}/favorite")
def unfavorite_gene(gene_id: str, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    fav = db.query(FavoriteGene).filter(
        FavoriteGene.user_id == current_user.user_id,
        FavoriteGene.gene_id == gene_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
    return {"message": "Gene unfavorited successfully"}
