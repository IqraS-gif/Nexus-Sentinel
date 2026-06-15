from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import DemoStageEnum

class DemoStateResponse(BaseModel):
    id: int
    current_stage: DemoStageEnum
    history_loaded: bool
    last_reset: datetime

    model_config = ConfigDict(from_attributes=True)
