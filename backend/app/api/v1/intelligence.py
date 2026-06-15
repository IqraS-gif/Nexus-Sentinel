from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.intelligence.intelligence_service import IntelligenceService
from pydantic import BaseModel

router = APIRouter(tags=["Intelligence"])

# Schema definitions for Custom Context Report Generation
class CustomIncidentSchema(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    service: str
    severity: str
    resolution: Optional[str] = None

class CustomRecallResultSchema(BaseModel):
    text: str
    type: str
    metadata: Optional[Dict[str, Any]] = None

class CustomReflectResultSchema(BaseModel):
    reasoning: str
    recommended_action: str

class CustomObservationSchema(BaseModel):
    title: str
    description: str
    evidence_count: int

class CustomAnalyzePayload(BaseModel):
    incident: CustomIncidentSchema
    recall_results: List[CustomRecallResultSchema]
    reflect_results: CustomReflectResultSchema
    observations: List[CustomObservationSchema]
    confidence_score: float

class IntelligenceReportResponseSchema(BaseModel):
    executive_summary: str
    root_cause_analysis: str
    supporting_evidence: str
    recommended_actions: str
    risk_assessment: str
    confidence_explanation: str

class IncidentReportWrapperSchema(BaseModel):
    incident_id: int
    title: str
    service: str
    report: IntelligenceReportResponseSchema
    confidence_score: float

class CustomReportWrapperSchema(BaseModel):
    report: IntelligenceReportResponseSchema
    confidence_score: float

@router.post("/intelligence/analyze", response_model=CustomReportWrapperSchema, status_code=status.HTTP_200_OK)
async def analyze_custom_context(payload: CustomAnalyzePayload, db: Session = Depends(get_db)):
    try:
        return await IntelligenceService.analyze_custom_context(payload.model_dump(), db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Custom context analysis failed: {str(e)}"
        )

@router.post("/incidents/{id}/report", response_model=IncidentReportWrapperSchema, status_code=status.HTTP_200_OK)
async def generate_incident_report(id: int, db: Session = Depends(get_db)):
    try:
        return await IntelligenceService.generate_report_for_incident(db, incident_id=id)
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Incident report generation failed: {str(e)}"
        )
