from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import random

from app.api import deps
from app.db.models import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.security import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.services.email_service import send_otp_email
from app.config import settings
from pydantic import BaseModel
from datetime import timedelta

router = APIRouter()


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


@router.post("/register", response_model=UserResponse)
def register(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
):
    db_user = db.query(User).filter(
        (User.username == user_in.username)
        | (User.email == user_in.email)
    ).first()

    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )

    hashed_password = get_password_hash(user_in.password)

    # First user becomes Admin, everyone else is Researcher
    user_count = db.query(User).count()
    role = "Admin" if user_count == 0 else "Researcher"

    db_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role=role,
        email_verified=True,
        verification_code=None
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        return {"status": "success", "message": "If that email exists, a reset code has been sent."}

    otp = str(random.randint(100000, 999999))
    user.verification_code = otp
    db.commit()

    send_otp_email(
        to_email=user.email,
        otp=otp,
        subject="DiseaseGeneMap — Reset Your Password",
        purpose="password_reset"
    )

    print(f"\n{'='*50}\nPASSWORD RESET OTP: {otp}\nEMAIL: {user.email}\n{'='*50}\n")

    return {"status": "success", "message": "If that email exists, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.verification_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.password_hash = get_password_hash(payload.new_password)
    user.verification_code = None
    db.commit()

    return {"status": "success", "message": "Password reset successfully"}


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return current_user

@router.delete("/clear-stuck-user")
def clear_stuck_user(email: str, db: Session = Depends(deps.get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user:
        db.delete(user)
        db.commit()
        return {"status": "deleted", "email": email}
    return {"status": "not found"}