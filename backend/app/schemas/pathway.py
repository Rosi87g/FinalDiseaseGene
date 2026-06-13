from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class PathwayBase(BaseModel):
    pathway_id: str = Field(..., description="Unique biological pathway ID, e.g., PATH0001")
    pathway_name: str = Field(..., description="Full descriptive name of the pathway")
    description: Optional[str] = Field(None, description="Detailed explanation of the pathway mechanism")

class PathwayCreate(PathwayBase):
    pass

class PathwayResponse(PathwayBase):
    model_config = ConfigDict(from_attributes=True)
