# phase-4a.md

# Phase 4A — Learning Timeline Engine

Status: Approved

Goal:

Create a chronological learning timeline that visualizes how Nexus Sentinel becomes smarter over time.

The timeline is the primary demonstration feature for judges.

---

# Deliverables

Timeline Service

Timeline Events

Learning Progression Engine

Observation Evolution Tracking

---

# Timeline Event Types

INCIDENT_CREATED

MEMORY_RETAINED

MEMORY_RECALLED

REFLECTION_GENERATED

OBSERVATION_CREATED

OBSERVATION_STRENGTHENED

---

# Timeline Workflow

Incident

↓

Memory Retained

↓

Memory Recalled

↓

Reflection Generated

↓

Observation Created

↓

Observation Strengthened

---

# APIs

GET /api/v1/timeline

GET /api/v1/timeline/{service}

---

# Timeline Response

event_type

timestamp

title

description

confidence_score

related_incidents

---

# Success Criteria

Timeline events generated.

Observation evolution visible.

Learning progression visible.

Frontend can consume timeline directly.
