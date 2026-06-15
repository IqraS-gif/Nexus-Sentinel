# phase-3b.md

# Phase 3B — Memory Foundation

Status: Approved

Goal:

Establish memory bank architecture and incident retention workflows using Hindsight Cloud.

This phase introduces persistent memory storage.

The system should be capable of storing incidents into the correct memory bank.

No retrieval workflows should be implemented yet.

No reflection workflows should be implemented yet.

No prediction workflows should be implemented yet.

---

# Deliverables

Create memory bank management.

Create incident retention service.

Create synthetic seed incident loader.

---

# Memory Banks

payment-bank

Stores:

* payment incidents
* payment fixes
* payment observations

---

auth-bank

Stores:

* authentication incidents
* login failures
* latency incidents

---

database-bank

Stores:

* database failures
* connection issues
* query bottlenecks

---

gateway-bank

Stores:

* gateway failures
* routing incidents
* rate limits

---

# Retention Workflow

When an incident is resolved:

1. Determine service type.
2. Select appropriate bank.
3. Store incident memory in Hindsight.
4. Store resolution details.
5. Store metadata.

---

# Required Metadata

incident_id

service

severity

status

timestamp

---

# Seed Data Support

Create:

seed_data.json

Include:

* Payment 502 Errors
* Redis Pool Exhaustion
* Auth Latency
* DB Timeout
* Gateway Rate Limit

Minimum:

20 synthetic incidents.

---

# Endpoints

POST /api/v1/memory/seed

POST /api/v1/memory/retain/{incident_id}

GET /api/v1/memory/banks

---

# Success Criteria

Memory banks exist.

Seed incidents load successfully.

Resolved incidents can be retained.

Metadata appears correctly inside Hindsight.

No recall functionality exists yet.

No reflect functionality exists yet.
