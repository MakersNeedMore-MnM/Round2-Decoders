from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("/")
async def health_check():
    """Health check endpoint."""

    return {
        "status": "healthy",
        "framework": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }