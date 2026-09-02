from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid, csv, os, io
from pydantic import BaseModel

from app.api import deps
from app.db.models import UserUpload, User, Gene
from app.db.session import Base

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── Conflict Check Models ─────────────────────────────────────────────────────

class ConflictCheckRequest(BaseModel):
    dataset_type: str
    rows: List[dict]

class ConflictRow(BaseModel):
    id_field: str       # e.g. "gene_id"
    id_value: str       # e.g. "GENE0001"
    uploaded: dict      # full row from uploaded CSV
    existing: dict      # full row from DB


# ─── ID field mapping per dataset type ────────────────────────────────────────

ID_FIELDS = {
    "genes":        "gene_id",
    "diseases":     "disease_id",
    "variants":     "variant_id",
    "associations": "association_id",
    "drugs":        "drug_target_id",
    "publications": "publication_id",
    "pathways":     "pathway_id",
}

# DB model mapping — only genes is in DB right now, others come from CSV files
# Extend this as you add more DB models
DB_MODELS = {
    "genes": Gene,
}

# Gene field mapping: CSV column → DB column
GENE_FIELD_MAP = {
    "gene_id":     "gene_id",
    "gene_symbol": "gene_symbol",
    "gene_name":   "gene_name",
    "chromosome":  "chromosome",
    "function":    "function",
    "protein":     "protein",
}


# ─── Helper: fetch existing record as dict ────────────────────────────────────

def gene_to_dict(g: Gene) -> dict:
    return {
        "gene_id":     g.gene_id,
        "gene_symbol": g.gene_symbol,
        "gene_name":   g.gene_name,
        "chromosome":  g.chromosome,
        "function":    g.function,
        "protein":     g.protein,
    }


# ─── Conflict Check Endpoint ──────────────────────────────────────────────────

@router.post("/check-conflicts")
def check_conflicts(
    payload: ConflictCheckRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    dataset_type = payload.dataset_type
    rows = payload.rows

    if dataset_type not in ID_FIELDS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset type: {dataset_type}")

    id_field = ID_FIELDS[dataset_type]
    conflicts: List[ConflictRow] = []

    # Currently only genes are stored in DB — extend as you add more models
    if dataset_type == "genes":
        for row in rows:
            id_value = row.get(id_field, "").strip()
            if not id_value:
                continue
            existing = db.query(Gene).filter(Gene.gene_id == id_value).first()
            if existing:
                existing_dict = gene_to_dict(existing)
                # Only flag as conflict if any field actually differs
                differs = any(
                    str(row.get(k, "")).strip() != str(existing_dict.get(k, "")).strip()
                    for k in GENE_FIELD_MAP
                )
                if differs:
                    conflicts.append({
                        "id_field":  id_field,
                        "id_value":  id_value,
                        "uploaded":  row,
                        "existing":  existing_dict,
                    })

    # For other types (diseases, variants, etc.) that aren't in DB yet,
    # return empty conflicts — no conflicts possible if no existing data
    return {"conflicts": conflicts, "total": len(conflicts)}


# ─── Upload Endpoint ──────────────────────────────────────────────────────────

@router.post("/")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
    dataset_type: str = Form(...),
    conflict_resolution: str = Form(default="skip"),  # "skip" | "overwrite" | "merge"
    conflict_ids: str = Form(default=""),              # comma-separated IDs to apply resolution to
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    try:
        decoded = contents.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        rows = list(reader)
        row_count = len(rows)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    # Parse conflict IDs that need special handling
    conflict_id_set = set(i.strip() for i in conflict_ids.split(",") if i.strip())

    id_field = ID_FIELDS.get(dataset_type, "")

    # Save file to disk
    upload_id = str(uuid.uuid4())[:12].replace('-', '')
    safe_filename = f"{upload_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, 'wb') as f:
        f.write(contents)

    print("DATASET TYPE:", dataset_type)
    print("TOTAL ROWS:", len(rows))
    print("CONFLICT RESOLUTION:", conflict_resolution, "| IDS:", conflict_id_set)

    # ─── INGESTION LOGIC ──────────────────────────────────────────────────────
    if dataset_type == "genes":
        print("GENE IMPORT STARTED")
        for row in rows:
            row_id = row.get("gene_id", "").strip()
            existing = db.query(Gene).filter(Gene.gene_id == row_id).first()

            if existing:
                # This row has a conflict — apply resolution
                if row_id in conflict_id_set:
                    if conflict_resolution == "overwrite":
                        # Replace all fields with uploaded values
                        existing.gene_symbol = row.get("gene_symbol", existing.gene_symbol)
                        existing.gene_name   = row.get("gene_name",   existing.gene_name)
                        existing.chromosome  = row.get("chromosome",  existing.chromosome)
                        existing.function    = row.get("function",    existing.function)
                        existing.protein     = row.get("protein",     existing.protein)
                        print(f"OVERWRITE: {row_id}")

                    elif conflict_resolution == "merge":
                        # Only fill fields that are currently empty in DB
                        if not existing.gene_symbol: existing.gene_symbol = row.get("gene_symbol", "")
                        if not existing.gene_name:   existing.gene_name   = row.get("gene_name",   "")
                        if not existing.chromosome:  existing.chromosome  = row.get("chromosome",  "")
                        if not existing.function:    existing.function    = row.get("function",    "")
                        if not existing.protein:     existing.protein     = row.get("protein",     "")
                        print(f"MERGE: {row_id}")

                    else:  # skip
                        print(f"SKIP: {row_id}")
                else:
                    # Not in conflict list (no diff) — skip silently
                    pass
            else:
                # New record — always add
                db.add(Gene(
                    gene_id=row_id,
                    gene_symbol=row.get("gene_symbol", ""),
                    gene_name=row.get("gene_name", ""),
                    chromosome=row.get("chromosome", ""),
                    function=row.get("function", ""),
                    protein=row.get("protein", ""),
                ))
                print(f"ADD: {row_id}")

        db.commit()
        print("GENE IMPORT FINISHED")

    # Save upload metadata
    upload = UserUpload(
        upload_id=upload_id,
        user_id=current_user.user_id,
        filename=file.filename,
        dataset_name=dataset_name,
        dataset_type=dataset_type,
        row_count=row_count,
        file_path=file_path,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {
        "upload_id":    upload.upload_id,
        "dataset_name": upload.dataset_name,
        "dataset_type": upload.dataset_type,
        "row_count":    upload.row_count,
        "uploaded_at":  upload.uploaded_at,
    }


# ─── Existing endpoints unchanged ─────────────────────────────────────────────

@router.get("/")
def get_my_uploads(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    uploads = db.query(UserUpload).filter(
        UserUpload.user_id == current_user.user_id
    ).order_by(UserUpload.uploaded_at.desc()).all()

    return [
        {
            "upload_id":    u.upload_id,
            "dataset_name": u.dataset_name,
            "filename":     u.filename,
            "dataset_type": u.dataset_type,
            "row_count":    u.row_count,
            "uploaded_at":  u.uploaded_at,
        }
        for u in uploads
    ]


@router.get("/{upload_id}/data")
def get_upload_data(
    upload_id: str,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    upload = db.query(UserUpload).filter(
        UserUpload.upload_id == upload_id,
        UserUpload.user_id == current_user.user_id
    ).first()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    try:
        with open(upload.file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        return rows[skip: skip + limit]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read file")


@router.delete("/{upload_id}")
def delete_upload(
    upload_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    upload = db.query(UserUpload).filter(
        UserUpload.upload_id == upload_id,
        UserUpload.user_id == current_user.user_id
    ).first()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if os.path.exists(upload.file_path):
        os.remove(upload.file_path)

    db.delete(upload)
    db.commit()
    return {"message": "Upload deleted successfully"}