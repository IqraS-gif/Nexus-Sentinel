from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.detection.service import DetectionService

router = APIRouter(prefix="/detection", tags=["Detection Intelligence"])


class AnalyzeRequest(BaseModel):
    input: str
    source_meta: Optional[dict] = None


@router.post("/seed-kb", status_code=status.HTTP_200_OK)
async def seed_knowledge_base():
    """
    One-time setup: ingests all 502 incidents from the DevOps CSV dataset
    into the Hindsight 'devops-kb-bank' as searchable vector memories.
    """
    try:
        result = await DetectionService.seed_knowledge_base()
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")


@router.get("/status-kb", status_code=status.HTTP_200_OK)
async def get_kb_status():
    """Check the status of the devops-kb-bank knowledge base."""
    try:
        return await DetectionService.get_kb_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/github", status_code=status.HTTP_200_OK)
async def fetch_github_feed(limit: int = 10):
    """
    Fetches live DevOps issues and failed CI runs from GitHub.
    Uses GITHUB_TOKEN if configured, falls back to public access.
    """
    try:
        results = await DetectionService.fetch_github_feed(limit=limit)
        return {"source": "github", "count": len(results), "incidents": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub fetch failed: {str(e)}")


@router.get("/live-status", status_code=status.HTTP_200_OK)
async def fetch_live_status(limit: int = 15):
    """
    Fetches live incidents from public status pages:
    GitHub, Cloudflare, Heroku, Atlassian — no authentication required.
    """
    try:
        results = await DetectionService.fetch_status_pages(limit=limit)
        return {"source": "status_pages", "count": len(results), "incidents": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status page fetch failed: {str(e)}")


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_input(request: AnalyzeRequest):
    """
    Full Detection Intelligence Pipeline on any raw input:
    logs, metrics, natural language, JSON alerts, or a pre-fetched live incident.

    Returns: classification, recalled similar incidents from KB, confidence score,
    recommended action, avg time-to-resolve, and alert level.
    """
    if not request.input or len(request.input.strip()) < 5:
        raise HTTPException(status_code=400, detail="Input is too short to analyze.")
    try:
        result = await DetectionService.run_detection_pipeline(
            raw_input=request.input,
            source_meta=request.source_meta,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection pipeline failed: {str(e)}")
