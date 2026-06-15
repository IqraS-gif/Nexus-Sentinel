# phase-3a.md

# Phase 3A — Hindsight Infrastructure

Status: Approved

Goal:

Connect Nexus Sentinel to Hindsight Cloud.

This phase establishes connectivity only.

No business intelligence should be implemented.

No prediction logic should be implemented.

No timeline generation should be implemented.

No memory workflows should be implemented.

No reflect workflows should be implemented.

---

# Deliverables

Create a dedicated memory module.

Folder:

app/memory/

---

Create:

client.py

Responsibilities:

* initialize Hindsight client
* manage API key
* expose reusable client instance

---

Create:

config integration

Environment Variables:

HINDSIGHT_API_KEY

HINDSIGHT_PROJECT_ID

---

Create:

health verification service

Purpose:

Verify connection to Hindsight Cloud.

---

Create:

memory status endpoint

GET /api/v1/memory/status

Response:

{
"connected": true,
"provider": "hindsight"
}

---

# Rules

Do not:

* create banks
* retain memories
* recall memories
* reflect memories
* create observations

Only establish connectivity.

---

# Success Criteria

Backend starts successfully.

Hindsight client initializes.

Connection verification works.

Memory status endpoint returns success.

No memory operations exist yet.
 