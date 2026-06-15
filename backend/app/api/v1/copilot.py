from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.services.memory.service import MemoryService
from app.services.observations.service import ObservationService
from app.services.incidents.service import IncidentService
from app.services.intelligence.intelligence_service import IntelligenceService
import logging

logger = logging.getLogger("nexus-sentinel.copilot")

router = APIRouter(prefix="/copilot", tags=["Copilot"])

BANKS = ["payment-bank", "auth-bank", "database-bank", "gateway-bank"]

class CopilotQueryRequest(BaseModel):
    question: str
    service: Optional[str] = None  # If known, restricts recall to one bank

class CopilotResponse(BaseModel):
    question: str
    answer: str
    root_cause_analysis: str
    recommended_actions: str
    risk_assessment: str
    confidence_score: float
    supporting_incidents: List[int]
    supporting_memories: List[dict]
    observations_used: List[dict]
    recall_results: List[dict]

@router.post("/query", response_model=CopilotResponse, status_code=status.HTTP_200_OK)
async def copilot_query(payload: CopilotQueryRequest, db: Session = Depends(get_db)):
    """
    Incident Intelligence Copilot endpoint.

    Given an operational question:
    1. Recalls memories from all Hindsight banks (or service-specific bank)
    2. Reflects on the best-matching bank
    3. Fetches observations and recent incidents
    4. Sends consolidated context to Groq for a structured answer
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # ── Step 1: Recall from all banks (or specific bank) ─────────────────────
    banks_to_query = BANKS
    if payload.service:
        specific_bank = MemoryService.map_service_to_bank(payload.service)
        banks_to_query = [specific_bank]

    all_recall_results = []
    for bank_id in banks_to_query:
        try:
            recall_res = await MemoryService.recall_memories(bank_id, question)
            results = recall_res.get("results", [])
            for r in results:
                r["bank_id"] = bank_id
            all_recall_results.extend(results)
        except Exception as e:
            logger.warning(f"Recall failed for bank {bank_id}: {e}")

    # ── Step 2: Reflect on best bank ─────────────────────────────────────────
    # Use service-specific bank if provided, else payment-bank (most common)
    reflect_bank = MemoryService.map_service_to_bank(payload.service or "payment")
    reflect_result = {}
    try:
        reflect_result = await MemoryService.reflect_memories(reflect_bank, question, db=db)
    except Exception as e:
        logger.warning(f"Reflect failed: {e}")
        reflect_result = {
            "reasoning": "Unable to retrieve reflections.",
            "recommended_action": "Manual investigation required.",
            "confidence_score": 0.2,
            "supporting_memories": [],
            "supporting_incidents": []
        }

    # ── Step 3: Fetch observations ────────────────────────────────────────────
    observations = []
    try:
        service_filter = payload.service if payload.service else None
        observations = await ObservationService.get_observations(db, service=service_filter)
        observations = [
            {
                "title": o.get("title", ""),
                "description": o.get("description", ""),
                "evidence_count": o.get("evidence_count", 0)
            }
            for o in observations[:5]  # Top 5 most relevant observations
        ]
    except Exception as e:
        logger.warning(f"Observations fetch failed: {e}")

    # ── Step 4: Build a synthetic incident context for Groq ──────────────────
    synthetic_incident = {
        "id": None,
        "title": question,
        "description": question,
        "service": payload.service or "unknown",
        "severity": "high",
        "resolution": None
    }

    recall_for_groq = [
        {"text": r.get("text", ""), "type": r.get("type", "memory"), "metadata": r.get("metadata", {})}
        for r in all_recall_results[:8]
    ]

    reflect_for_groq = {
        "reasoning": reflect_result.get("reasoning", ""),
        "recommended_action": reflect_result.get("recommended_action", "")
    }

    confidence_score = float(reflect_result.get("confidence_score", 0.3))
    if all_recall_results:
        confidence_score = min(0.95, confidence_score + 0.1 * len(all_recall_results))

    # ── Step 5: Send to Groq via IntelligenceService ─────────────────────────
    groq_payload = {
        "incident": synthetic_incident,
        "recall_results": recall_for_groq,
        "reflect_results": reflect_for_groq,
        "observations": observations,
        "confidence_score": confidence_score
    }

    try:
        groq_result = await IntelligenceService.analyze_custom_context(groq_payload, db)
        report = groq_result.get("report", {})
    except Exception as e:
        logger.error(f"Groq analysis failed: {e}")
        report = {
            "executive_summary": reflect_result.get("reasoning", "Analysis unavailable."),
            "root_cause_analysis": "Unable to generate analysis. Check Groq connection.",
            "supporting_evidence": "",
            "recommended_actions": reflect_result.get("recommended_action", "Manual investigation required."),
            "risk_assessment": "Unknown — analysis failed.",
            "confidence_explanation": "Low confidence due to analysis failure."
        }

    return CopilotResponse(
        question=question,
        answer=report.get("executive_summary", ""),
        root_cause_analysis=report.get("root_cause_analysis", ""),
        recommended_actions=report.get("recommended_actions", ""),
        risk_assessment=report.get("risk_assessment", ""),
        confidence_score=round(groq_result.get("confidence_score", confidence_score) if "groq_result" in dir() else confidence_score, 2),
        supporting_incidents=reflect_result.get("supporting_incidents", []),
        supporting_memories=reflect_result.get("supporting_memories", []),
        observations_used=observations,
        recall_results=[
            {"text": r.get("text", ""), "type": r.get("type", ""), "bank_id": r.get("bank_id", "")}
            for r in all_recall_results[:6]
        ]
    )

class DirectChatRequest(BaseModel):
    system_prompt: str
    user_message: str

class DirectChatResponse(BaseModel):
    answer: str

@router.post("/direct-chat", response_model=DirectChatResponse, status_code=status.HTTP_200_OK)
async def direct_chat(payload: DirectChatRequest):
    """
    Sends a free-form prompt directly to Groq, bypassing Hindsight recall/reflect.
    Used by the incident result chat where rich context is already provided by the caller.
    """
    from app.services.intelligence.groq_client import groq_client
    import asyncio

    if not groq_client.client:
        return DirectChatResponse(answer="⚠️ Groq is not configured. Please set GROQ_API_KEY in your .env file.")

    try:
        loop = asyncio.get_event_loop()
        def call_groq():
            return groq_client.client.chat.completions.create(
                model=groq_client.model,
                messages=[
                    {"role": "system", "content": payload.system_prompt},
                    {"role": "user",   "content": payload.user_message},
                ],
                temperature=0.3,
                max_tokens=1024,
            )
        response = await loop.run_in_executor(None, call_groq)
        answer = response.choices[0].message.content.strip()
        return DirectChatResponse(answer=answer)
    except Exception as e:
        logger.error(f"Direct chat Groq call failed: {e}")
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")
