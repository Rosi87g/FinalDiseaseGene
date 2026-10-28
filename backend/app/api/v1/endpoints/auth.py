from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
<<<<<<< HEAD
from typing import Optional
=======
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
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
from app.schemas.user import validate_password_strength
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
<<<<<<< HEAD
    clean_username = user_in.username.strip()
    clean_email = user_in.email.strip().lower()

    db_user = db.query(User).filter(
        (User.username == clean_username)
        | (User.email == clean_email)
=======
    db_user = db.query(User).filter(
        (User.username == user_in.username)
        | (User.email == user_in.email)
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
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
<<<<<<< HEAD
        username=clean_username,
        email=clean_email,
=======
        username=user_in.username,
        email=user_in.email,
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
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

    try:
        validate_password_strength(payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user.password_hash = get_password_hash(payload.new_password)
    user.verification_code = None
    db.commit()

    return {"status": "success", "message": "Password reset successfully"}


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db)
):
<<<<<<< HEAD
    login_id = form_data.username.strip() if form_data.username else ""
    user = db.query(User).filter(
        (User.username == login_id) | (User.email == login_id)
    ).first()
=======
    user = db.query(User).filter(User.username == form_data.username).first()
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962

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


<<<<<<< HEAD
class ProfileUpdateRequest(BaseModel):
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None


=======
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
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

<<<<<<< HEAD

@router.put("/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to update profile"
        )

    new_username = payload.username.strip()

    if not new_username or len(new_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long"
        )

    # Check for duplicate username
    existing_user = db.query(User).filter(
        User.username == new_username,
        User.user_id != current_user.user_id
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{new_username}' is already in use."
        )

    # Email is NOT modified per policy
    current_user.username = new_username
    db.commit()
    db.refresh(current_user)

    # Generate a fresh access token for the updated username
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=current_user.username,
        role=current_user.role,
        expires_delta=access_token_expires
    )

    avatar_url = payload.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={current_user.username}&backgroundColor=0e1018"

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": avatar_url,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.delete("/delete-account")
def delete_account(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to delete account"
        )
    deleted_username = current_user.username
    db.delete(current_user)
    db.commit()
    return {
        "status": "success",
        "message": f"Account '{deleted_username}' and all associated records have been permanently deleted."
    }

=======
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
@router.delete("/clear-stuck-user")
def clear_stuck_user(email: str, db: Session = Depends(deps.get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user:
        db.delete(user)
        db.commit()
        return {"status": "deleted", "email": email}
    return {"status": "not found"}