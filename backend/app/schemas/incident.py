from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import SeverityEnum, StatusEnum

class IncidentBase(BaseModel):
    title: str
    service: str
    severity: SeverityEnum
    status: StatusEnum = StatusEnum.ACTIVE
    description: str

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    service: Optional[str] = None
    severity: Optional[SeverityEnum] = None
    status: Optional[StatusEnum] = None
    description: Optional[str] = None
    resolution: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    resolution: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
