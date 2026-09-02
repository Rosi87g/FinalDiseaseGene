from fastapi import APIRouter, Depends, HTTPException  # ← add HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any

from app.api import deps
from app.db.models import DiseaseGeneAssociation, Gene, Disease
from app.schemas.association import NetworkGraphResponse, NetworkNode, NetworkLink

router = APIRouter()

@router.get("/network", response_model=NetworkGraphResponse)
def get_network(
    min_confidence: float = 0.5,
    limit: int = 150,
    db: Session = Depends(deps.get_db)
):
    associations = (
        db.query(DiseaseGeneAssociation)
        .options(
            joinedload(DiseaseGeneAssociation.gene),
            joinedload(DiseaseGeneAssociation.disease)
        )
        .filter(DiseaseGeneAssociation.confidence_score >= min_confidence)
        .order_by(DiseaseGeneAssociation.confidence_score.desc())
        .limit(limit)
        .all()
    )
    
    nodes_dict: Dict[str, NetworkNode] = {}
    links: List[NetworkLink] = []
    
    for assoc in associations:
        g = assoc.gene
        d = assoc.disease
        if not g or not d:
            continue
        
        if g.gene_id not in nodes_dict:
            nodes_dict[g.gene_id] = NetworkNode(
                id=g.gene_id,
                label=g.gene_symbol,
                type="gene",
                group=g.chromosome or "Unknown",
                chromosome=g.chromosome,
                gene_name=g.gene_name,
                function=g.function
            )
            
        if d.disease_id not in nodes_dict:
            nodes_dict[d.disease_id] = NetworkNode(
                id=d.disease_id,
                label=d.disease_name,
                type="disease",
                group=d.category or "Unknown",
                category=d.category
            )
            
        links.append(NetworkLink(
            source=g.gene_id,
            target=d.disease_id,
            score=assoc.confidence_score,
            evidence=assoc.evidence_level
        ))
        
    return NetworkGraphResponse(nodes=list(nodes_dict.values()), links=links)


# ── NEW: flat list endpoint for the explorer tab ──────────────────────────────
@router.get("/")
def get_associations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    associations = (
        db.query(DiseaseGeneAssociation)
        .options(
            joinedload(DiseaseGeneAssociation.gene),
            joinedload(DiseaseGeneAssociation.disease)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "association_id": a.association_id,
            "gene_id": a.gene_id,
            "disease_id": a.disease_id,
            "confidence": a.confidence_score,   # ← renamed to match frontend key
            "evidence_level": a.evidence_level,
        }
        for a in associations
    ]


@router.get("/{association_id}")
def get_association_detail(association_id: str, db: Session = Depends(deps.get_db)):
    assoc = db.query(DiseaseGeneAssociation).filter(
        DiseaseGeneAssociation.association_id == association_id
    ).first()
    if not assoc:
        raise HTTPException(status_code=404, detail="Association not found")
    return assoc