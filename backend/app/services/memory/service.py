import os
import json
import logging
from datetime import datetime
from typing import List, Dict
from sqlalchemy.orm import Session
from app.memory.client import memory_client
from app.models.incident import Incident
from app.models.enums import SeverityEnum, StatusEnum
from app.services.incidents.service import IncidentService

logger = logging.getLogger("nexus-sentinel.memory_service")

# Mapping of service strings to Hindsight memory bank IDs
SERVICE_BANK_MAP = {
    "payment": "payment-bank",
    "auth": "auth-bank",
    "database": "database-bank",
    "gateway": "gateway-bank"
}

class MemoryService:
    @staticmethod
    def map_service_to_bank(service: str) -> str:
        """
        Maps a service name to the appropriate Hindsight memory bank ID.
        """
        srv = service.lower().strip()
        # Substring/prefix matches for robust mapping
        for key, bank_id in SERVICE_BANK_MAP.items():
            if key in srv:
                return bank_id
        return "gateway-bank"  # Default fallback

    @staticmethod
    async def initialize_banks():
        """
        Ensures the required Hindsight memory banks exist on Hindsight Cloud.
        """
        if not memory_client.client:
            logger.error("Hindsight client is not initialized. Skipping bank creation.")
            return

        required_banks = list(SERVICE_BANK_MAP.values())
        try:
            # Query existing banks
            banks_resp = await memory_client.client.banks.list_banks()
            existing_ids = [b.bank_id for b in banks_resp.banks] if hasattr(banks_resp, "banks") else []
            
            for bank_id in required_banks:
                if bank_id not in existing_ids:
                    logger.info(f"Creating bank: {bank_id}")
                    # Using the client's async acreate_bank method
                    await memory_client.client.acreate_bank(
                        bank_id=bank_id,
                        name=bank_id.replace("-", " ").title()
                    )
                    logger.info(f"Successfully created bank: {bank_id}")
        except Exception as e:
            logger.error(f"Error during memory banks initialization: {str(e)}", exc_info=True)

    @staticmethod
    async def list_banks() -> List[Dict]:
        """
        Retrieves the list of memory banks from Hindsight.
        """
        if not memory_client.client:
            return []
        try:
            banks_resp = await memory_client.client.banks.list_banks()
            # Serialize the response objects into standard dictionaries
            return [
                {
                    "bank_id": b.bank_id,
                    "name": b.name,
                    "created_at": b.created_at.isoformat() if hasattr(getattr(b, "created_at", None), "isoformat") else getattr(b, "created_at", None)
                } for b in banks_resp.banks
            ] if hasattr(banks_resp, "banks") else []
        except Exception as e:
            logger.error(f"Failed to list Hindsight banks: {str(e)}")
            return []

    @staticmethod
    async def retain_incident(db: Session, incident_id: int) -> Dict:
        """
        Selects appropriate bank based on service and retains the resolved incident in Hindsight.
        """
        incident = IncidentService.get_incident(db, incident_id)
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found.")

        if incident.status != StatusEnum.RESOLVED:
            raise ValueError(f"Incident {incident_id} is not resolved. Only resolved incidents can be retained.")

        bank_id = MemoryService.map_service_to_bank(incident.service)
        content = (
            f"Incident: {incident.title}\n"
            f"Description: {incident.description}\n"
            f"Resolution: {incident.resolution if incident.resolution else 'None'}"
        )

        metadata = {
            "incident_id": str(incident.id),
            "service": incident.service,
            "severity": incident.severity.value if hasattr(incident.severity, "value") else str(incident.severity),
            "status": incident.status.value if hasattr(incident.status, "value") else str(incident.status),
            "timestamp": incident.created_at.isoformat()
        }

        try:
            logger.info(f"Retaining incident {incident.id} in bank {bank_id}...")
            # Use async SDK method to retain the memory
            ret = await memory_client.client.aretain(
                bank_id=bank_id,
                content=content,
                context=f"resolved incident review for {incident.service}",
                timestamp=incident.created_at,
                document_id=f"incident_{incident.id}",
                metadata=metadata
            )
            logger.info(f"Incident {incident.id} successfully retained in bank {bank_id}.")
            return {
                "success": True,
                "bank_id": bank_id,
                "incident_id": incident.id,
                "hindsight_response": str(ret)
            }
        except Exception as e:
            logger.error(f"Failed to retain incident {incident.id} in Hindsight: {str(e)}", exc_info=True)
            return {
                "success": False,
                "bank_id": bank_id,
                "incident_id": incident.id,
                "error": str(e)
            }

    @staticmethod
    async def seed_data(db: Session) -> Dict:
        """
        Reads seed_data.json, seeds incidents to local SQLite DB, and retains resolved ones in Hindsight.
        """
        resource_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "resources",
            "seed_data.json"
        )
        if not os.path.exists(resource_path):
            # Fallback path if directory structure differs
            resource_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "resources",
                "seed_data.json"
            )

        if not os.path.exists(resource_path):
            raise FileNotFoundError(f"Seed data resource not found at path: {resource_path}")

        with open(resource_path, "r", encoding="utf-8") as f:
            seeds = json.load(f)

        # Clear existing incidents first to ensure clean state
        db.query(Incident).delete()
        db.commit()

        # Ensure banks are initialized first
        await MemoryService.initialize_banks()

        seeded_count = 0
        retained_count = 0
        failures = []

        for item in seeds:
            # Parse created_at string to datetime
            created_at_dt = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))

            # Map text status/severity to our enums
            try:
                status_enum = StatusEnum(item["status"])
            except ValueError:
                status_enum = StatusEnum.ACTIVE

            try:
                severity_enum = SeverityEnum(item["severity"])
            except ValueError:
                severity_enum = SeverityEnum.MEDIUM

            db_incident = Incident(
                title=item["title"],
                description=item["description"],
                service=item["service"],
                severity=severity_enum,
                status=status_enum,
                resolution=item.get("resolution"),
                created_at=created_at_dt
            )
            db.add(db_incident)
            db.commit()
            db.refresh(db_incident)
            seeded_count += 1

            # If resolved, retain in Hindsight Cloud
            if status_enum == StatusEnum.RESOLVED:
                ret_res = await MemoryService.retain_incident(db, db_incident.id)
                if ret_res.get("success"):
                    retained_count += 1
                else:
                    failures.append({
                        "incident_id": db_incident.id,
                        "error": ret_res.get("error")
                    })

        return {
            "seeded_count": seeded_count,
            "retained_count": retained_count,
            "failures": failures
        }

    @staticmethod
    async def recall_memories(bank_id: str, query: str) -> Dict:
        """
        Recall memories from Hindsight Cloud based on bank_id and query.
        """
        if not memory_client.client:
            raise RuntimeError("Hindsight client is not initialized.")
        try:
            logger.info(f"Recalling memories from bank {bank_id} with query: {query}")
            # Use async SDK method arecall
            response = await memory_client.client.arecall(bank_id=bank_id, query=query)
            
            results = []
            if hasattr(response, "results") and response.results:
                for r in response.results:
                    results.append({
                        "id": r.id,
                        "text": r.text,
                        "type": r.type,
                        "context": r.context,
                        "metadata": r.metadata,
                        "tags": r.tags,
                        "entities": r.entities
                    })
            return {"results": results}
        except Exception as e:
            logger.error(f"Recall failed on bank {bank_id}: {str(e)}", exc_info=True)
            raise e

    @staticmethod
    async def build_evidence(db: Session, incident_id: int) -> Dict:
        """
        Retrieves similar memories for an incident, ranks them, and builds a structured evidence response.
        """
        incident = IncidentService.get_incident(db, incident_id)
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found.")

        bank_id = MemoryService.map_service_to_bank(incident.service)
        
        # Query Hindsight with incident title as semantic query
        recall_res = await MemoryService.recall_memories(bank_id, incident.title)
        results = recall_res.get("results", [])

        # Process results
        similar_incidents = []
        matched_services = set()
        recommended_fix = "No historical resolution found."
        confidence_score = 0.0

        if results:
            confidence_score = 0.5  # Base confidence if any matches found
            
            for idx, r in enumerate(results):
                metadata = r.get("metadata") or {}
                service = metadata.get("service")
                if service:
                    matched_services.add(service)
                    # Boost confidence if a match for the same service is in top results
                    if idx < 3 and service.lower() == incident.service.lower():
                        confidence_score = 0.85

                similar_incidents.append({
                    "id": r.get("id"),
                    "text": r.get("text"),
                    "type": r.get("type"),
                    "metadata": metadata
                })

                # Try to extract the resolution/recommended fix from the text
                txt = r.get("text", "")
                if recommended_fix == "No historical resolution found.":
                    if "Resolution: " in txt:
                        parts = txt.split("Resolution: ")
                        if len(parts) > 1 and parts[1].strip() != "None":
                            recommended_fix = parts[1].strip()
                    elif "resolved" in txt.lower() or "fix" in txt.lower():
                        recommended_fix = txt

        return {
            "similar_incidents": similar_incidents,
            "confidence_score": confidence_score,
            "recommended_fix": recommended_fix,
            "matched_services": list(matched_services),
            "memory_count": len(results)
        }

    @staticmethod
    async def reflect_memories(bank_id: str, query: str, db: Session = None) -> Dict:
        """
        Reflect on memories in Hindsight using the areflect SDK method.
        """
        if not memory_client.client:
            raise RuntimeError("Hindsight client is not initialized.")
        try:
            logger.info(f"Reflecting in bank {bank_id} with query: {query}")
            
            # Schema to enforce structured outputs from LLM
            schema = {
                "type": "object",
                "properties": {
                    "reasoning": {"type": "string", "description": "The evidence-based reasoning summarizing the cause of the incident and linking to historical context."},
                    "recommended_action": {"type": "string", "description": "Actionable recommended resolution steps based on historical patterns."},
                    "confidence_score": {"type": "number", "description": "Confidence score between 0.0 and 1.0 based on availability of matching past incidents."}
                },
                "required": ["reasoning", "recommended_action", "confidence_score"]
            }

            response = await memory_client.client.areflect(
                bank_id=bank_id,
                query=query,
                include_facts=True,
                response_schema=schema
            )

            # Extract structured output
            structured = getattr(response, "structured_output", None) or {}
            reasoning = structured.get("reasoning", "")
            recommended_action = structured.get("recommended_action", "")
            confidence_score = structured.get("confidence_score", 0.0)

            # Fallback to plain text if structured output failed
            if not reasoning and hasattr(response, "text") and response.text:
                reasoning = response.text
                recommended_action = "Investigate the retrieved memories to formulate resolution steps."
                confidence_score = 0.5

            supporting_memories = []
            supporting_incidents = []

            if hasattr(response, "based_on") and response.based_on:
                memories_list = getattr(response.based_on, "memories", []) or []
                db_incidents = db.query(Incident).all() if db else []
                
                for m in memories_list:
                    m_id = getattr(m, "id", None)
                    m_text = getattr(m, "text", "") or ""
                    m_type = getattr(m, "type", None)
                    m_metadata = getattr(m, "metadata", {}) or {}
                    
                    supporting_memories.append({
                        "id": m_id,
                        "text": m_text,
                        "type": m_type,
                        "metadata": m_metadata
                    })
                    
                    # 1. Match from metadata
                    incident_id = m_metadata.get("incident_id")
                    if incident_id:
                        try:
                            supporting_incidents.append(int(incident_id))
                        except ValueError:
                            supporting_incidents.append(incident_id)
                            
                    # 2. Match from text or resolution references
                    if db:
                        import re
                        m_text_lower = m_text.lower()
                        for inc in db_incidents:
                            matched = False
                            if inc.resolution and len(inc.resolution) > 10 and inc.resolution.lower() in m_text_lower:
                                matched = True
                            elif inc.title.lower() in m_text_lower:
                                matched = True
                            elif inc.description.lower() in m_text_lower:
                                matched = True
                            
                            if matched:
                                supporting_incidents.append(inc.id)
                        
                        # 3. Match from numbers in text that correspond to valid incident IDs
                        numbers = re.findall(r'\b\d+\b', m_text)
                        for num_str in numbers:
                            try:
                                num = int(num_str)
                                if any(inc.id == num for inc in db_incidents):
                                    supporting_incidents.append(num)
                            except Exception:
                                pass

            supporting_incidents = sorted(list(set(supporting_incidents)), key=lambda x: str(x))

            return {
                "reasoning": reasoning,
                "recommended_action": recommended_action,
                "confidence_score": confidence_score,
                "supporting_memories": supporting_memories,
                "supporting_incidents": supporting_incidents
            }
        except Exception as e:
            logger.error(f"Reflect failed on bank {bank_id}: {str(e)}", exc_info=True)
            raise e

    @staticmethod
    async def analyze_incident(db: Session, incident_id: int) -> Dict:
        """
        Analyze a specific incident using Hindsight areflect.
        """
        incident = IncidentService.get_incident(db, incident_id)
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found.")

        bank_id = MemoryService.map_service_to_bank(incident.service)
        query = (
            f"Incident Title: {incident.title}\n"
            f"Description: {incident.description}\n"
            f"Service: {incident.service}\n"
            f"Severity: {incident.severity.value if hasattr(incident.severity, 'value') else str(incident.severity)}"
        )
        
        return await MemoryService.reflect_memories(bank_id, query, db=db)


