from datetime import datetime
from sqlalchemy import Column, Integer, Boolean, DateTime, Enum as SQLEnum
from app.core.database import Base
from app.models.enums import DemoStageEnum

class DemoState(Base):
    __tablename__ = "demo_state"

    id = Column(Integer, primary_key=True, index=True)
    current_stage = Column(SQLEnum(DemoStageEnum), default=DemoStageEnum.ACT_1, nullable=False)
    history_loaded = Column(Boolean, default=False, nullable=False)
    last_reset = Column(DateTime, default=datetime.utcnow, nullable=False)
