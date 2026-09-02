from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    genes,
    diseases,
    variants,
    pathways,
    admin,
    associations,
    search,
    drugs, publications,
    stats, uploads
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(genes.router, prefix="/genes", tags=["Genes"])
api_router.include_router(diseases.router, prefix="/diseases", tags=["Diseases"])
api_router.include_router(variants.router, prefix="/variants", tags=["Variants"])
api_router.include_router(pathways.router, prefix="/pathways", tags=["Pathways"])
api_router.include_router(associations.router, prefix="/associations", tags=["Associations"])
api_router.include_router(drugs.router, prefix="/drugs", tags=["Drugs"])
api_router.include_router(publications.router, prefix="/publications", tags=["Publications"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(
    stats.router,
    prefix="/stats",
    tags=["Statistics"]
)
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)
