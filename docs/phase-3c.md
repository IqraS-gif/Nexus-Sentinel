# phase-3c.md

# Phase 3C — Recall Intelligence

Status: Approved

Goal:

Implement memory retrieval and evidence generation using Hindsight Cloud.

The system should retrieve relevant historical incidents and provide supporting evidence.

No reflection workflows should be implemented yet.

No prediction workflows should be implemented yet.

---

# Deliverables

Memory Recall Service

Evidence Builder

Recall APIs

Similarity Scoring

---

# Recall Workflow

Input:

New Incident

↓

Select Bank

↓

Recall Similar Memories

↓

Rank Results

↓

Build Evidence Response

↓

Return Similar Incidents

---

# Evidence Response

Include:

similar_incidents

confidence_score

recommended_fix

matched_services

memory_count

---

# API Endpoints

POST /api/v1/memory/recall

POST /api/v1/incidents/{id}/similar

---

# Success Criteria

System retrieves relevant memories.

Results ranked by relevance.

Evidence payload generated.

Known fixes returned when available.

No reflection functionality exists yet.
