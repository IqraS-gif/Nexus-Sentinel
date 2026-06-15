from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.observations.service import ObservationService
from pydantic import BaseModel

router = APIRouter(prefix="/observations", tags=["Observations"])

class ObservationResponseSchema(BaseModel):
    title: str
    description: str
    evidence_count: int
    confidence_score: float
    related_incidents: List[int]
    related_memories: List[str]
    service: str

@router.post("/generate", response_model=List[ObservationResponseSchema], status_code=status.HTTP_200_OK)
async def generate_observations(db: Session = Depends(get_db)):
    try:
        return await ObservationService.generate_all_observations(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate observations: {str(e)}"
        )

@router.get("/", response_model=List[ObservationResponseSchema], status_code=status.HTTP_200_OK)
async def get_all_observations(db: Session = Depends(get_db)):
    try:
        return await ObservationService.get_observations(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve observations: {str(e)}"
        )

@router.get("/{service}", response_model=List[ObservationResponseSchema], status_code=status.HTTP_200_OK)
async def get_observations_by_service(service: str, db: Session = Depends(get_db)):
    try:
        return await ObservationService.get_observations(db, service=service)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve observations for service {service}: {str(e)}"
        )
