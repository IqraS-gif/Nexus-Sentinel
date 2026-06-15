from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.timeline.service import TimelineService
from pydantic import BaseModel

router = APIRouter(prefix="/timeline", tags=["Timeline"])

class TimelineEventResponseSchema(BaseModel):
    event_type: str
    timestamp: str
    title: str
    description: str
    confidence_score: float
    related_incidents: List[int]

@router.get("/", response_model=List[TimelineEventResponseSchema], status_code=status.HTTP_200_OK)
async def get_timeline(db: Session = Depends(get_db)):
    try:
        return await TimelineService.generate_timeline_events(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate timeline: {str(e)}"
        )

@router.get("/{service}", response_model=List[TimelineEventResponseSchema], status_code=status.HTTP_200_OK)
async def get_timeline_by_service(service: str, db: Session = Depends(get_db)):
    try:
        return await TimelineService.generate_timeline_events(db, service=service)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate timeline for service {service}: {str(e)}"
        )
