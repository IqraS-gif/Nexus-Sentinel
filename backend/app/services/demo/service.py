from datetime import datetime
from sqlalchemy.orm import Session
from app.models.demo_state import DemoState
from app.models.incident import Incident
from app.models.enums import DemoStageEnum

class DemoService:
    @staticmethod
    def get_or_create_demo_state(db: Session) -> DemoState:
        state = db.query(DemoState).first()
        if not state:
            state = DemoState(
                current_stage=DemoStageEnum.ACT_1,
                history_loaded=False,
                last_reset=datetime.utcnow()
            )
            db.add(state)
            db.commit()
            db.refresh(state)
        return state

    @staticmethod
    def reset_demo_state(db: Session) -> DemoState:
        # Delete all incidents
        db.query(Incident).delete()
        
        # Get or create state
        state = db.query(DemoState).first()
        if state:
            state.current_stage = DemoStageEnum.ACT_1
            state.history_loaded = False
            state.last_reset = datetime.utcnow()
        else:
            state = DemoState(
                current_stage=DemoStageEnum.ACT_1,
                history_loaded=False,
                last_reset=datetime.utcnow()
            )
            db.add(state)
            
        db.commit()
        db.refresh(state)
        return state
