import logging
from typing import Dict
from sqlalchemy.orm import Session

from app.services.incidents.service import IncidentService
from app.services.memory.service import MemoryService
from app.services.observations.service import ObservationService
from app.services.intelligence.prompt_builder import PromptBuilder
from app.services.intelligence.groq_client import groq_client

logger = logging.getLogger("nexus-sentinel.intelligence_service")

class IntelligenceService:
    @staticmethod
    async def generate_report_for_incident(db: Session, incident_id: int) -> Dict:
        """
        Gathers memory recalls, reflections, observations, and incident data
        to compile a comprehensive Groq intelligence report.
        """
        logger.info(f"Generating intelligence report for Incident {incident_id}...")
        
        # 1. Fetch Incident Data
        incident = IncidentService.get_incident(db, incident_id)
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found.")
            
        incident_data = {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "service": incident.service,
            "severity": incident.severity.value if hasattr(incident.severity, "value") else str(incident.severity),
            "resolution": incident.resolution
        }

        # 2. Fetch Recall Context (Similar memories)
        recall_res = {}
        try:
            bank_id = MemoryService.map_service_to_bank(incident.service)
            recall_res = await MemoryService.recall_memories(bank_id, incident.title)
        except Exception as e:
            logger.error(f"Recall lookup failed during report generation: {str(e)}")

        recall_results = recall_res.get("results", [])

        # 3. Fetch Reflect Context (Reasoning)
        reflect_results = {}
        try:
            reflect_results = await MemoryService.analyze_incident(db, incident_id)
        except Exception as e:
            logger.error(f"Reflect lookup failed during report generation: {str(e)}")

        # 4. Fetch Observations Context
        observations = []
        try:
            observations = await ObservationService.get_observations(db, service=incident.service)
        except Exception as e:
            logger.error(f"Observations lookup failed during report generation: {str(e)}")

        # Calculate base confidence score based on recollections
        confidence_score = reflect_results.get("confidence_score", 0.5)

        # 5. Build Prompts
        system_prompt = PromptBuilder.build_system_prompt()
        user_prompt = PromptBuilder.build_user_prompt(
            incident_data=incident_data,
            recall_results=recall_results,
            reflect_results=reflect_results,
            observations=observations,
            confidence_score=confidence_score
        )

        # 6. Call Groq
        try:
            report = await groq_client.generate_chat_completion(system_prompt, user_prompt)
            sanitized_report = IntelligenceService._sanitize_report_fields(report)
            
            # Formulate final output payload
            return {
                "incident_id": incident.id,
                "title": incident.title,
                "service": incident.service,
                "report": sanitized_report,
                "confidence_score": confidence_score
            }
        except Exception as e:
            logger.error(f"Failed to generate Groq intelligence report: {str(e)}", exc_info=True)
            raise e

    @staticmethod
    async def analyze_custom_context(payload: Dict, db: Session) -> Dict:
        """
        Accepts custom user-provided context structure to generate an intelligence report.
        """
        logger.info("Analyzing custom incident context using Groq...")
        
        incident_data = payload.get("incident", {})
        recall_results = payload.get("recall_results", [])
        reflect_results = payload.get("reflect_results", {})
        observations = payload.get("observations", [])
        confidence_score = payload.get("confidence_score", 0.5)

        system_prompt = PromptBuilder.build_system_prompt()
        user_prompt = PromptBuilder.build_user_prompt(
            incident_data=incident_data,
            recall_results=recall_results,
            reflect_results=reflect_results,
            observations=observations,
            confidence_score=confidence_score
        )

        try:
            report = await groq_client.generate_chat_completion(system_prompt, user_prompt)
            sanitized_report = IntelligenceService._sanitize_report_fields(report)
            return {
                "report": sanitized_report,
                "confidence_score": confidence_score
            }
        except Exception as e:
            logger.error(f"Failed to analyze custom context: {str(e)}", exc_info=True)
            raise e

    @staticmethod
    def _sanitize_report_fields(report: Dict) -> Dict:
        """
        Ensures all fields in the report dictionary are string format to conform
        strictly with Pydantic's IntelligenceReportResponseSchema.
        """
        sanitized = {}
        for key, value in report.items():
            if isinstance(value, list):
                items = []
                for item in value:
                    if isinstance(item, dict):
                        if "text" in item:
                            items.append(str(item["text"]))
                        else:
                            items.append(", ".join(f"{k}: {v}" for k, v in item.items()))
                    else:
                        items.append(str(item))
                sanitized[key] = "\n".join(items)
            elif isinstance(value, dict):
                sanitized[key] = "\n".join(f"{k.replace('_', ' ').title()}: {v}" for k, v in value.items())
            else:
                sanitized[key] = str(value) if value is not None else ""
        return sanitized

