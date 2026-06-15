from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.services.incidents.service import IncidentService
from pydantic import BaseModel

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class ResolveIncidentRequest(BaseModel):
    resolution: str

@router.get("/", response_model=List[IncidentResponse])
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return IncidentService.get_incidents(db, skip=skip, limit=limit)

@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    return IncidentService.create_incident(db, incident)

@router.get("/{id}", response_model=IncidentResponse)
def read_incident(id: int, db: Session = Depends(get_db)):
    db_incident = IncidentService.get_incident(db, incident_id=id)
    if db_incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident

@router.post("/{id}/resolve", response_model=IncidentResponse)
def resolve_incident(id: int, request: ResolveIncidentRequest, db: Session = Depends(get_db)):
    db_incident = IncidentService.resolve_incident(db, incident_id=id, resolution=request.resolution)
    if db_incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident

from app.services.memory.service import MemoryService

@router.post("/{id}/similar", status_code=status.HTTP_200_OK)
async def read_similar_incidents(id: int, db: Session = Depends(get_db)):
    try:
        return await MemoryService.build_evidence(db, incident_id=id)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build evidence: {str(e)}"
        )

@router.post("/{id}/analyze", status_code=status.HTTP_200_OK)
async def analyze_incident_endpoint(id: int, db: Session = Depends(get_db)):
    try:
        return await MemoryService.analyze_incident(db, incident_id=id)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze incident: {str(e)}"
        )

