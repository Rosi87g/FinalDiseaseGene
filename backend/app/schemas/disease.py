from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class DiseaseBase(BaseModel):
    disease_id: str = Field(..., description="Unique disease identifier, e.g., DIS0001")
    disease_name: str = Field(..., description="Full name of the disease")
    category: str = Field(..., description="Medical category, e.g., Cardiology")
    icd_code: str = Field(..., description="ICD code classification, e.g., ICD0001")

class DiseaseCreate(DiseaseBase):
    pass

class DiseaseResponse(DiseaseBase):
    model_config = ConfigDict(from_attributes=True)

class GeneSummary(BaseModel):
    gene_id: str
    gene_symbol: str
    gene_name: str
    model_config = ConfigDict(from_attributes=True)

class DiseaseAssociationSummary(BaseModel):
    association_id: str
    gene: GeneSummary
    confidence_score: float
    evidence_level: str
    model_config = ConfigDict(from_attributes=True)

class DiseaseDetailResponse(DiseaseResponse):
    associations: List[DiseaseAssociationSummary] = []
    model_config = ConfigDict(from_attributes=True)
