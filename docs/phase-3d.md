# phase-3d.md

# Phase 3D — Reflect Intelligence

Status: Approved

Goal:

Transform memory retrieval into evidence-based reasoning using Hindsight reflect().

The system should analyze recalled memories and generate an operational recommendation.

This phase introduces agent reasoning.

No prediction workflows should be implemented yet.

No timeline generation should be implemented yet.

---

# Deliverables

Reflect Service

Reasoning Builder

Recommendation Generator

Evidence Trace

---

# Reflect Workflow

Incident

↓

Recall Memories

↓

Reflect

↓

Reasoning Generated

↓

Recommendation Generated

↓

Evidence Returned

---

# Evidence Response

Include:

reasoning

recommended_action

confidence_score

supporting_memories

supporting_incidents

---

# Endpoints

POST /api/v1/memory/reflect

POST /api/v1/incidents/{id}/analyze

---

# Success Criteria

Agent provides reasoning.

Agent explains recommendations.

Evidence trace exists.

Recommendations reference historical incidents.

No predictions exist yet.
