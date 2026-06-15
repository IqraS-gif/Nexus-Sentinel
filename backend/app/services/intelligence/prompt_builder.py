import json
from typing import Dict, List

class PromptBuilder:
    @staticmethod
    def build_system_prompt() -> str:
        """
        Builds the system prompt guiding Groq to act as an Incident Intelligence Analyst
        and return a structured JSON response.
        """
        return (
            "You are a Senior Incident Intelligence Analyst. Your task is to analyze operational incident details "
            "along with long-term memory records (recollections, reflections, and patterns) to construct a "
            "highly professional, human-friendly executive report.\n\n"
            "You must output a structured JSON object containing exactly these fields:\n"
            "- executive_summary: A concise, human-friendly overview of the incident and what was done.\n"
            "- root_cause_analysis: A technical explanation of why this happened based on current and past details.\n"
            "- supporting_evidence: Summarize the supporting facts or previous outages recalled from memory in clean, natural, human-friendly English. DO NOT include raw Python lists, dictionaries, brackets, or JSON payloads here.\n"
            "- recommended_actions: Bullet points or numbered lists detailing actionable steps to prevent recurrence. Write this as a clean string listing the actions, not a JSON array.\n"
            "- risk_assessment: Assessment of operational risk (e.g. low, medium, high) and implications in a simple conversational string.\n"
            "- confidence_explanation: A justification of the calculated confidence score based on memory match depth.\n\n"
            "Ensure the output conforms strictly to this JSON format and contains no extra text outside the JSON object."
        )

    @staticmethod
    def build_user_prompt(
        incident_data: Dict,
        recall_results: List[Dict],
        reflect_results: Dict,
        observations: List[Dict],
        confidence_score: float
    ) -> str:
        """
        Builds the user prompt compiling all relevant context inputs.
        """
        # Format input context nicely
        context = {
            "incident": {
                "id": incident_data.get("id"),
                "title": incident_data.get("title"),
                "description": incident_data.get("description"),
                "service": incident_data.get("service"),
                "severity": incident_data.get("severity"),
                "resolution": incident_data.get("resolution")
            },
            "confidence_score": confidence_score,
            "hindsight_recollections": [
                {
                    "text": r.get("text"),
                    "type": r.get("type"),
                    "metadata": r.get("metadata")
                } for r in recall_results[:5]
            ],
            "hindsight_reflections": {
                "reasoning": reflect_results.get("reasoning"),
                "recommended_action": reflect_results.get("recommended_action")
            },
            "active_consolidated_observations": [
                {
                    "title": o.get("title"),
                    "description": o.get("description"),
                    "evidence_count": o.get("evidence_count")
                } for o in observations[:3]
            ]
        }
        
        return (
            "Analyze the following operational incident and long-term memory context to generate the structured JSON report:\n\n"
            f"{json.dumps(context, indent=2)}\n\n"
            "Output your findings as a raw JSON object matching the requested schema."
        )
