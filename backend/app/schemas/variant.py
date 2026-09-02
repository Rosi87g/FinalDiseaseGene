from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class VariantBase(BaseModel):
    variant_id: str = Field(..., description="Unique variant identifier, e.g., VAR0001")
    gene_id: str = Field(..., description="FK reference to genes, e.g., GENE0050")
    variant_name: str = Field(..., description="Variant marker name, e.g., Mutation_1")
    mutation_type: str = Field(..., description="Type of mutation, e.g., Frameshift, Insertion, Deletion, Missense")
    clinical_significance: str = Field(..., description="Pathogenicity level, e.g., Pathogenic, Benign, etc.")

class VariantCreate(VariantBase):
    pass

class VariantResponse(VariantBase):
    model_config = ConfigDict(from_attributes=True)

class GeneSymbolSummary(BaseModel):
    gene_symbol: str
    gene_name: str
    model_config = ConfigDict(from_attributes=True)

class VariantDetailResponse(VariantResponse):
    gene: GeneSymbolSummary
    model_config = ConfigDict(from_attributes=True)
