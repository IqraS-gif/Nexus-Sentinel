import logging
import asyncio
import urllib.request
import json
import re
from typing import List, Dict
from sqlalchemy.orm import Session

from app.core.config import settings
from app.memory.client import memory_client
from app.models.incident import Incident
from app.services.memory.service import SERVICE_BANK_MAP, MemoryService

logger = logging.getLogger("nexus-sentinel.observation_service")

class ObservationService:
    @staticmethod
    async def trigger_consolidation_http(bank_id: str) -> Dict:
        """
        Triggers memory consolidation on Hindsight Cloud via direct HTTP POST request.
        """
        url = f"{settings.HINDSIGHT_BASE_URL.rstrip('/')}/v1/default/banks/{bank_id}/consolidate"
        headers = {
            "Content-Type": "application/json"
        }
        if settings.HINDSIGHT_API_KEY:
            headers["Authorization"] = f"Bearer {settings.HINDSIGHT_API_KEY}"
            
        req = urllib.request.Request(url, data=b"{}", headers=headers, method="POST")
        try:
            loop = asyncio.get_event_loop()
            def do_request():
                with urllib.request.urlopen(req, timeout=30.0) as response:
                    return response.read().decode('utf-8')
            res = await loop.run_in_executor(None, do_request)
            return json.loads(res)
        except Exception as e:
            logger.error(f"HTTP Consolidation trigger failed for bank {bank_id}: {str(e)}")
            return {"status": "failed", "error": str(e)}

    @staticmethod
    async def generate_all_observations(db: Session) -> List[Dict]:
        """
        Triggers consolidation across all memory banks, extracts consolidated observations,
        resolves links to source incidents/memories, and builds structured observation responses.
        """
        all_observations = []
        
        # Trigger consolidation and retrieve observations for each bank
        for service_name, bank_id in SERVICE_BANK_MAP.items():
            logger.info(f"Triggering consolidation for bank: {bank_id}")
            # Trigger consolidation
            await ObservationService.trigger_consolidation_http(bank_id)
            
            # Fetch all memory units for this bank
            try:
                res = await memory_client.client.memory.list_memories(bank_id=bank_id)
                mems = res.items if hasattr(res, "items") else []
            except Exception as e:
                logger.error(f"Failed to retrieve memories for bank {bank_id}: {str(e)}")
                continue

            # Filter out observations and source memories
            observations = [m for m in mems if m.get("fact_type") == "observation"]
            source_memories = [m for m in mems if m.get("fact_type") in ("world", "experience")]

            # Load incidents from DB to resolve connections
            db_incidents = db.query(Incident).all()

            for obs in observations:
                text = obs.get("text", "")
                evidence_count = obs.get("proof_count") or 1
                
                # Confidence score logic: base confidence + incremental value per evidence/proof count
                confidence_score = min(1.0, 0.5 + (evidence_count * 0.1))
                
                # Format Title (short summary)
                title = text.split(".")[0].strip()
                if len(title) > 60:
                    title = title[:57] + "..."

                # Find related incidents
                related_incidents = []
                text_lower = text.lower()
                for inc in db_incidents:
                    matched = False
                    if inc.resolution and len(inc.resolution) > 10 and inc.resolution.lower() in text_lower:
                        matched = True
                    elif inc.title.lower() in text_lower:
                        matched = True
                    elif inc.description.lower() in text_lower:
                        matched = True
                        
                    if matched:
                        related_incidents.append(inc.id)
                
                # Regex match for explicit incident number mentions in text
                numbers = re.findall(r'\b\d+\b', text)
                for num_str in numbers:
                    try:
                        num = int(num_str)
                        if any(inc.id == num for inc in db_incidents) and num not in related_incidents:
                            related_incidents.append(num)
                    except Exception:
                        pass
                
                # Find related source memories (heuristically match semantic terms)
                related_memories = []
                keywords = ["stripe", "paypal", "timeout", "redis", "pool", "ldap", "auth", "verification", "double charge", "lag", "backup", "broker", "rabbitmq"]
                for src in source_memories:
                    src_text = src.get("text", "")
                    src_lower = src_text.lower()
                    # Check if they share key technical terms
                    shared_terms = [k for k in keywords if k in text_lower and k in src_lower]
                    if shared_terms:
                        related_memories.append(src_text)

                all_observations.append({
                    "title": title,
                    "description": text,
                    "evidence_count": evidence_count,
                    "confidence_score": round(confidence_score, 2),
                    "related_incidents": sorted(list(set(related_incidents))),
                    "related_memories": sorted(list(set(related_memories)))[:5], # Limit to top 5
                    "service": service_name
                })

        # Rank all observations by confidence score and evidence count descending
        all_observations.sort(key=lambda x: (x["confidence_score"], x["evidence_count"]), reverse=True)
        return all_observations

    @staticmethod
    async def get_observations(db: Session, service: str = None) -> List[Dict]:
        """
        Retrieves consolidated observations. If service is specified, filters observations for that service.
        """
        # We perform a generate run on demand to fetch the latest observations
        observations = await ObservationService.generate_all_observations(db)
        if service:
            srv = service.lower().strip()
            observations = [o for o in observations if o["service"] == srv]
        return observations
