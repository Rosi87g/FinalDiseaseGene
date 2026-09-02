from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class GeneBase(BaseModel):
    gene_id: str = Field(..., description="Unique biological identifier, e.g., GENE0001")
    gene_symbol: str = Field(..., description="Shorthand symbol, e.g., GEN1")
    gene_name: str = Field(..., description="Full descriptive name of the gene")
    chromosome: str = Field(..., description="Human chromosome number, e.g., 1-22, X, Y")
    function: str = Field(..., description="Biological function category")
    protein: str = Field(..., description="Protein product name")

class GeneCreate(GeneBase):
    pass

class GeneResponse(GeneBase):
    model_config = ConfigDict(from_attributes=True)

# We import variants/associations schemas inside detail models or define short summaries
class VariantSummary(BaseModel):
    variant_id: str
    variant_name: str
    mutation_type: str
    clinical_significance: str
    model_config = ConfigDict(from_attributes=True)

class AssociationSummary(BaseModel):
    association_id: str
    disease_id: str
    confidence_score: float
    evidence_level: str
    model_config = ConfigDict(from_attributes=True)

class GeneDetailResponse(GeneResponse):
    variants: List[VariantSummary] = []
    associations: List[AssociationSummary] = []
    model_config = ConfigDict(from_attributes=True)
