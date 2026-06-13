from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.db.models import Disease, User, FavoriteDisease
from app.schemas.disease import DiseaseResponse, DiseaseDetailResponse

router = APIRouter()

@router.get("/", response_model=List[DiseaseResponse])
def get_diseases(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    query = db.query(Disease)
    if category:
        query = query.filter(Disease.category == category)
    return query.offset(skip).limit(limit).all()

@router.get("/{disease_id}", response_model=DiseaseDetailResponse)
def get_disease(disease_id: str, db: Session = Depends(deps.get_db)):
    disease = db.query(Disease).filter(Disease.disease_id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    return disease

@router.post("/{disease_id}/favorite", status_code=201)
def favorite_disease(disease_id: str, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    disease = db.query(Disease).filter(Disease.disease_id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
        
    already_fav = db.query(FavoriteDisease).filter(
        FavoriteDisease.user_id == current_user.user_id,
        FavoriteDisease.disease_id == disease_id
    ).first()
    if already_fav:
        return {"message": "Disease already favorited"}
        
    fav = FavoriteDisease(user_id=current_user.user_id, disease_id=disease_id)
    db.add(fav)
    db.commit()
    return {"message": "Disease favorited successfully"}

@router.delete("/{disease_id}/favorite")
def unfavorite_disease(disease_id: str, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    fav = db.query(FavoriteDisease).filter(
        FavoriteDisease.user_id == current_user.user_id,
        FavoriteDisease.disease_id == disease_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
    return {"message": "Disease unfavorited successfully"}
