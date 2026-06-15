from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.enums import StatusEnum
from app.schemas.incident import IncidentCreate, IncidentUpdate

class IncidentService:
    @staticmethod
    def get_incidents(db: Session, skip: int = 0, limit: int = 100) -> List[Incident]:
        return db.query(Incident).offset(skip).limit(limit).all()

    @staticmethod
    def get_incident(db: Session, incident_id: int) -> Optional[Incident]:
        return db.query(Incident).filter(Incident.id == incident_id).first()

    @staticmethod
    def create_incident(db: Session, incident_in: IncidentCreate) -> Incident:
        db_incident = Incident(
            title=incident_in.title,
            service=incident_in.service,
            severity=incident_in.severity,
            status=incident_in.status,
            description=incident_in.description
        )
        db.add(db_incident)
        db.commit()
        db.refresh(db_incident)
        return db_incident

    @staticmethod
    def resolve_incident(db: Session, incident_id: int, resolution: str) -> Optional[Incident]:
        db_incident = IncidentService.get_incident(db, incident_id)
        if db_incident:
            db_incident.status = StatusEnum.RESOLVED
            db_incident.resolution = resolution
            db.commit()
            db.refresh(db_incident)
        return db_incident
