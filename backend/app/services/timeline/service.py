import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.services.memory.service import SERVICE_BANK_MAP
from app.memory.client import memory_client

logger = logging.getLogger("nexus-sentinel.timeline_service")

class TimelineService:
    @staticmethod
    async def generate_timeline_events(db: Session, service: str = None) -> List[Dict]:
        """
        Generates, ranks, and returns chronological learning timeline events.
        """
        events = []
        
        # 1. Fetch incidents from DB
        query = db.query(Incident)
        if service:
            query = query.filter(Incident.service == service.lower().strip())
        incidents = query.all()
        
        # Map of service -> past incidents for recall tracking
        service_incidents = {}
        for inc in sorted(incidents, key=lambda x: x.created_at):
            s = inc.service.lower().strip()
            if s not in service_incidents:
                service_incidents[s] = []
            
            # --- Event: INCIDENT_CREATED ---
            events.append({
                "event_type": "INCIDENT_CREATED",
                "timestamp": inc.created_at.isoformat(),
                "title": f"Incident Reported: {inc.title}",
                "description": inc.description,
                "confidence_score": 0.0,
                "related_incidents": [inc.id]
            })
            
            # Check if there are past resolved incidents in the same service to show recall
            past_resolved = [p for p in service_incidents[s] if p.status.value == "resolved"]
            
            if past_resolved:
                # --- Event: MEMORY_RECALLED ---
                events.append({
                    "event_type": "MEMORY_RECALLED",
                    "timestamp": (inc.created_at + timedelta(seconds=1)).isoformat(),
                    "title": "Historical Context Recalled",
                    "description": f"Retrieved {len(past_resolved)} previous occurrence(s) in service '{inc.service}' to guide recovery.",
                    "confidence_score": 0.5,
                    "related_incidents": [p.id for p in past_resolved] + [inc.id]
                })
                
                # --- Event: REFLECTION_GENERATED ---
                events.append({
                    "event_type": "REFLECTION_GENERATED",
                    "timestamp": (inc.created_at + timedelta(seconds=2)).isoformat(),
                    "title": "Reasoning & Recommendation Formulated",
                    "description": f"Analyzed incident patterns using Hindsight reflect. Formulated recovery action based on historical fix.",
                    "confidence_score": 0.85,
                    "related_incidents": [inc.id]
                })
            
            # --- Event: MEMORY_RETAINED ---
            if inc.status.value == "resolved":
                events.append({
                    "event_type": "MEMORY_RETAINED",
                    "timestamp": (inc.created_at + timedelta(seconds=5)).isoformat(),
                    "title": f"Knowledge Retained: Incident {inc.id}",
                    "description": f"Resolution steps and metadata for '{inc.title}' stored in Hindsight memory.",
                    "confidence_score": 0.3,
                    "related_incidents": [inc.id]
                })
                
            service_incidents[s].append(inc)

        # 2. Fetch observations from Hindsight Cloud
        for service_name, bank_id in SERVICE_BANK_MAP.items():
            # Filter if service param is provided
            if service and service_name != service.lower().strip():
                continue
                
            try:
                res = await memory_client.client.memory.list_memories(bank_id=bank_id)
                mems = res.items if hasattr(res, "items") else []
            except Exception as e:
                logger.error(f"Timeline failed to fetch memories from bank {bank_id}: {str(e)}")
                continue

            observations = [m for m in mems if m.get("fact_type") == "observation"]

            for obs in observations:
                text = obs.get("text", "")
                proof_count = obs.get("proof_count") or 1
                
                # Find matching incidents to date the observation
                related_incidents = []
                text_lower = text.lower()
                for inc in incidents:
                    matched = False
                    if inc.resolution and len(inc.resolution) > 10 and inc.resolution.lower() in text_lower:
                        matched = True
                    elif inc.title.lower() in text_lower:
                        matched = True
                    elif inc.description.lower() in text_lower:
                        matched = True
                    if matched:
                        related_incidents.append(inc)

                if not related_incidents:
                    continue
                
                # Sort related incidents to locate first and latest occurrences
                related_incidents.sort(key=lambda x: x.created_at)
                related_ids = [inc.id for inc in related_incidents]
                
                first_incident = related_incidents[0]
                latest_incident = related_incidents[-1]

                # Short title for the observation
                short_title = text.split(".")[0].strip()
                if len(short_title) > 50:
                    short_title = short_title[:47] + "..."

                # --- Event: OBSERVATION_CREATED ---
                events.append({
                    "event_type": "OBSERVATION_CREATED",
                    "timestamp": (first_incident.created_at + timedelta(seconds=10)).isoformat(),
                    "title": f"Operational Pattern Identified: {short_title}",
                    "description": f"Consolidated new operational pattern from experience: '{text}'",
                    "confidence_score": 0.6,
                    "related_incidents": [first_incident.id]
                })

                # --- Event: OBSERVATION_STRENGTHENED (if proof_count > 1) ---
                if proof_count > 1 and len(related_incidents) > 1:
                    conf = min(1.0, 0.6 + (proof_count * 0.1))
                    events.append({
                        "event_type": "OBSERVATION_STRENGTHENED",
                        "timestamp": (latest_incident.created_at + timedelta(seconds=10)).isoformat(),
                        "title": f"Operational Pattern Reinforced: {short_title}",
                        "description": f"Reinforced pattern with recurring evidence across {len(related_incidents)} occurrences (proof count: {proof_count}).",
                        "confidence_score": round(conf, 2),
                        "related_incidents": related_ids
                    })

        # 3. Sort events chronologically by timestamp
        events.sort(key=lambda x: x["timestamp"])
        return events
