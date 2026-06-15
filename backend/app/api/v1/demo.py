from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.demo_state import DemoStateResponse
from app.services.demo.service import DemoService

router = APIRouter(prefix="/demo-state", tags=["Demo State"])

@router.get("/", response_model=DemoStateResponse)
def read_demo_state(db: Session = Depends(get_db)):
    return DemoService.get_or_create_demo_state(db)

@router.post("/reset", response_model=DemoStateResponse)
def reset_demo_state(db: Session = Depends(get_db)):
    return DemoService.reset_demo_state(db)
