from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from app.config import settings
from app.db.session import engine
from app.db.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/", tags=["Root"])
def root_check():
    return {
        "message": "Welcome to the DiseaseGeneMap API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "configured",
        "search_engine": "configured"
    }

from fastapi import Depends
from sqlalchemy.orm import Session
from app.api.v1.router import api_router
from app.api.deps import get_db
from app.db.models import Gene, Disease, DiseaseGeneAssociation, Variant, Pathway

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get(f"{settings.API_V1_STR}/stats", tags=["Stats"])
def get_stats(db: Session = Depends(get_db)):
    # 1. Basic counts
    genes_count = db.query(Gene).count()
    diseases_count = db.query(Disease).count()
    associations_count = db.query(DiseaseGeneAssociation).count()
    variants_count = db.query(Variant).count()
    pathways_count = db.query(Pathway).count()

    # 2. Aggregations (Use correct primary key names)
    # Using Gene.gene_id instead of Gene.id
    chr_dist = db.query(Gene.chromosome, func.count(Gene.gene_id)).group_by(Gene.chromosome).all()
    
    # Using DiseaseGeneAssociation.association_id instead of DiseaseGeneAssociation.id
    ev_dist = db.query(DiseaseGeneAssociation.evidence_level, func.count(DiseaseGeneAssociation.association_id)).group_by(DiseaseGeneAssociation.evidence_level).all()

    return {
        "genes": genes_count,
        "diseases": diseases_count,
        "associations": associations_count,
        "variants": variants_count,
        "pathways": pathways_count,
        "chromosome_data": {
            "labels": [f"Chr {row[0]}" for row in chr_dist],
            "values": [row[1] for row in chr_dist]
        },
        "pathogenicity_data": {
            "labels": [row[0] for row in ev_dist],
            "values": [row[1] for row in ev_dist]
        }
    }
