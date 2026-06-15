from fastapi import APIRouter, status, Depends, HTTPException
from app.memory.client import memory_client
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.memory.service import MemoryService

router = APIRouter(prefix="/memory", tags=["Memory"])

class MemoryStatusResponse(BaseModel):
    connected: bool
    provider: str

@router.get("/status", response_model=MemoryStatusResponse)
def get_memory_status():
    connected = memory_client.verify_connection()
    return {
        "connected": connected,
        "provider": "hindsight"
    }

@router.post("/seed", status_code=status.HTTP_200_OK)
async def seed_memory_data(db: Session = Depends(get_db)):
    try:
        return await MemoryService.seed_data(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed data: {str(e)}"
        )

@router.post("/retain/{incident_id}", status_code=status.HTTP_200_OK)
async def retain_incident_in_memory(incident_id: int, db: Session = Depends(get_db)):
    try:
        res = await MemoryService.retain_incident(db, incident_id)
        if not res.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=res.get("error", "Failed to retain incident.")
            )
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retention failed: {str(e)}"
        )

@router.get("/banks", status_code=status.HTTP_200_OK)
async def get_memory_banks():
    try:
        return await MemoryService.list_banks()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve banks: {str(e)}"
        )

class RecallRequestPayload(BaseModel):
    bank_id: str
    query: str

@router.post("/recall", status_code=status.HTTP_200_OK)
async def recall_memories_endpoint(payload: RecallRequestPayload):
    try:
        return await MemoryService.recall_memories(payload.bank_id, payload.query)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recall failed: {str(e)}"
        )

class ReflectRequestPayload(BaseModel):
    bank_id: str
    query: str

@router.post("/reflect", status_code=status.HTTP_200_OK)
async def reflect_memories_endpoint(payload: ReflectRequestPayload, db: Session = Depends(get_db)):
    try:
        return await MemoryService.reflect_memories(payload.bank_id, payload.query, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reflect failed: {str(e)}"
        )

