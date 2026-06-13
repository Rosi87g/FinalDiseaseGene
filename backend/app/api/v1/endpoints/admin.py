from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models import (
    Gene,
    Disease,
    Variant,
    Pathway,
    DiseaseGeneAssociation
)
from pydantic import BaseModel

class UpdateProfileRequest(BaseModel):
    username: str
    email: str

router = APIRouter()

@router.get("/overview")
def admin_overview(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    # Security check: Ensure user is authenticated and is an Admin
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return {
        "genes": db.query(Gene).count(),
        "diseases": db.query(Disease).count(),
        "variants": db.query(Variant).count(),
        "pathways": db.query(Pathway).count(),
        "associations": db.query(DiseaseGeneAssociation).count()
    }

@router.put("/profile")
def update_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    # Security check: Ensure user is authenticated and is an Admin
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Re-attach and update
    user_in_db = db.merge(current_user)
    
    user_in_db.username = payload.username
    user_in_db.email = payload.email

    db.commit()
    db.refresh(user_in_db)

    return {
        "username": user_in_db.username,
        "email": user_in_db.email,
        "role": user_in_db.role
    }