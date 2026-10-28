from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models import (
    Gene,
    Disease,
    Variant,
    Pathway,
<<<<<<< HEAD
    DiseaseGeneAssociation,
    User
)
from pydantic import BaseModel
from typing import Optional, List
from collections import deque
from datetime import datetime, timedelta
import uuid
from app.services.security import create_access_token
from app.config import settings

class UpdateProfileRequest(BaseModel):
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None

class TelemetryEventCreate(BaseModel):
    event_type: str
    target: str
    route: Optional[str] = "/"
    username: Optional[str] = "Anonymous"
    role: Optional[str] = "Guest"
    details: Optional[str] = None

# Thread-safe in-memory circular buffer for real-time diagnostic stream
telemetry_stream = deque(maxlen=250)

# Pre-populate initial system boot event
telemetry_stream.append({
    "id": str(uuid.uuid4())[:8],
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "time_str": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
    "event_type": "SYSTEM",
    "target": "Kernel Engine",
    "route": "/system",
    "username": "SYSTEM",
    "role": "Core",
    "details": "Diagnostic telemetry monitor online. Live user interaction and API gateway streaming enabled."
})

def record_internal_gateway_telemetry(method: str, path: str, status_code: int, duration_ms: float):
    """
    Directly logs API gateway traffic into the real-time diagnostic event stream.
    """
    now = datetime.utcnow()
    event = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": now.isoformat() + "Z",
        "time_str": now.strftime("%H:%M:%S.%f")[:-3],
        "event_type": "GATEWAY",
        "target": f"{method.upper()} {path[:80]}",
        "route": path.split("?")[0],
        "username": "API Gateway",
        "role": "Gateway",
        "details": f"Status: {status_code} • Latency: {duration_ms}ms"
    }
    telemetry_stream.append(event)
=======
    DiseaseGeneAssociation
)
from pydantic import BaseModel

class UpdateProfileRequest(BaseModel):
    username: str
    email: str
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962

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
<<<<<<< HEAD
    current_user: User = Depends(deps.get_current_user)
):
    # Security check: Ensure user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    new_username = payload.username.strip()

    if not new_username or len(new_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")

    # Check for duplicate username
    existing_user = db.query(User).filter(
        User.username == new_username,
        User.user_id != current_user.user_id
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"Username '{new_username}' is already in use.")

    # Re-attach and update username only
    user_in_db = db.merge(current_user)
    user_in_db.username = new_username
=======
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
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962

    db.commit()
    db.refresh(user_in_db)

<<<<<<< HEAD
    # Re-issue access token with new username subject
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_token = create_access_token(
        subject=user_in_db.username,
        role=user_in_db.role,
        expires_delta=access_token_expires
    )

    avatar_url = payload.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={user_in_db.username}&backgroundColor=0e1018"

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "username": user_in_db.username,
        "email": user_in_db.email,
        "role": user_in_db.role,
        "avatar_url": avatar_url,
        "access_token": new_token,
        "token_type": "bearer"
    }

@router.post("/telemetry")
def record_telemetry(payload: TelemetryEventCreate):
    """
    Records real live user interactions (button clicks, searches, navigation, queries)
    into the diagnostic event stream for the Admin Matrix panel.
    """
    now = datetime.utcnow()
    event = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": now.isoformat() + "Z",
        "time_str": now.strftime("%H:%M:%S.%f")[:-3],
        "event_type": payload.event_type.upper(),
        "target": payload.target,
        "route": payload.route or "/",
        "username": payload.username or "Anonymous",
        "role": payload.role or "Guest",
        "details": payload.details or ""
    }
    telemetry_stream.append(event)
    return {"status": "ok", "event_id": event["id"]}

@router.get("/telemetry")
def get_telemetry_stream(limit: int = 100):
    """
    Returns latest real diagnostic interaction logs in reverse chronological order.
    """
    events = list(telemetry_stream)
    return {"events": events[-limit:], "total": len(events)}

@router.delete("/telemetry")
def clear_telemetry_stream():
    """
    Clears the telemetry stream.
    """
    telemetry_stream.clear()
    now = datetime.utcnow()
    telemetry_stream.append({
        "id": str(uuid.uuid4())[:8],
        "timestamp": now.isoformat() + "Z",
        "time_str": now.strftime("%H:%M:%S.%f")[:-3],
        "event_type": "SYSTEM",
        "target": "Telemetry Stream",
        "route": "/admin",
        "username": "SYSTEM",
        "role": "Core",
        "details": "Diagnostic buffer cleared by operator."
    })
    return {"status": "cleared"}
=======
    return {
        "username": user_in_db.username,
        "email": user_in_db.email,
        "role": user_in_db.role
    }
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
