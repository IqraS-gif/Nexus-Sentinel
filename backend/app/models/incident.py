from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from app.core.database import Base
from app.models.enums import SeverityEnum, StatusEnum

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    service = Column(String, nullable=False)
    severity = Column(SQLEnum(SeverityEnum), nullable=False)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ACTIVE, nullable=False)
    description = Column(String, nullable=False)
    resolution = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
