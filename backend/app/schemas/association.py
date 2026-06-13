from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class AssociationBase(BaseModel):
    association_id: str = Field(..., description="Unique association ID, e.g., ASSOC00001")
    gene_id: str = Field(..., description="Foreign key reference to genes")
    disease_id: str = Field(..., description="Foreign key reference to diseases")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Float score ranging from 0.0 to 1.0")
    evidence_level: str = Field(..., description="Categorical evidence level, e.g., High, Medium, Low")

class AssociationCreate(AssociationBase):
    pass

class AssociationResponse(AssociationBase):
    model_config = ConfigDict(from_attributes=True)

class AssociationGeneDetail(BaseModel):
    gene_symbol: str
    gene_name: str
    chromosome: str
    model_config = ConfigDict(from_attributes=True)

class AssociationDiseaseDetail(BaseModel):
    disease_name: str
    category: str
    icd_code: str
    model_config = ConfigDict(from_attributes=True)

class AssociationDetailResponse(AssociationResponse):
    gene: AssociationGeneDetail
    disease: AssociationDiseaseDetail
    model_config = ConfigDict(from_attributes=True)

# Schema for D3 network graph nodes & links
class NetworkNode(BaseModel):
    id: str
    label: str
    type: str
    group: Optional[str] = None   # ← fix this
    chromosome: Optional[str] = None
    gene_name: Optional[str] = None
    function: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class NetworkLink(BaseModel):
    source: str     # gene_id or disease_id
    target: str     # disease_id or gene_id
    score: float    # confidence_score
    evidence: str   # evidence_level

class NetworkGraphResponse(BaseModel):
    nodes: list[NetworkNode]
    links: list[NetworkLink]