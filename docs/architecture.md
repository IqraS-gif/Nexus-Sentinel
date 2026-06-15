# architecture.md

# Nexus Sentinel Architecture

Version: 1.0

Status: Approved

---

# System Goal

Nexus Sentinel is an Incident Intelligence Agent that learns from operational history.

The system demonstrates four capabilities:

1. Remember
2. Learn
3. Predict
4. Preserve Knowledge

Every component exists to support at least one of these capabilities.

---

# High-Level Architecture

┌─────────────────────────────┐
│ React Frontend             │
└─────────────┬───────────────┘
│
▼
┌─────────────────────────────┐
│ FastAPI Backend            │
└─────────────┬───────────────┘
│
┌──────────┼──────────┐
▼          ▼          ▼

SQLite     Hindsight     Groq

Storage    Memory        Reasoning

---

# Core Learning Lifecycle

New Incident

↓

Incident Stored

↓

Memory Retained

↓

Similar Memories Retrieved

↓

Observations Formed

↓

Confidence Increased

↓

Predictions Generated

↓

Future Incident Occurs

↓

Prediction Validated

↓

Knowledge Strengthened

---

# Backend Modules

## Module 1

Incident Engine

Responsibilities:

* create incidents
* retrieve incidents
* update incidents
* resolve incidents

Folder:

app/services/incidents/

---

## Module 2

Memory Engine

Responsibilities:

* retain memories
* recall memories
* reflect reasoning
* manage banks

Folder:

app/memory/

---

## Module 3

Timeline Engine

Responsibilities:

* generate timeline events
* confidence progression
* observation history

Folder:

app/services/timeline/

---

## Module 4

Prediction Engine

Responsibilities:

* pattern detection
* confidence calculation
* recommendation generation

Folder:

app/services/predictions/

---

## Module 5

Demo Engine

Responsibilities:

* fast-forward simulation
* load synthetic history
* reset demo state

Folder:

app/services/demo/

---

# Memory Architecture

The project uses multiple memory banks.

---

Bank 1

payment-bank

Stores:

* payment incidents
* payment observations
* payment fixes

---

Bank 2

auth-bank

Stores:

* authentication incidents
* login failures
* latency issues

---

Bank 3

database-bank

Stores:

* database failures
* connection problems
* query bottlenecks

---

Bank 4

gateway-bank

Stores:

* API gateway issues
* rate limiting
* routing failures

---

# Hindsight Usage

retain()

Store:

* incidents
* fixes
* observations

---

recall()

Retrieve:

* similar incidents
* relevant fixes
* historical evidence

---

reflect()

Generate:

* reasoning
* confidence
* recommendations

---

observations

Generate:

* recurring patterns
* operational intelligence

---

mental models

Store:

* predefined runbooks
* known troubleshooting workflows

---

# Frontend Architecture

## Screen 1

Dashboard

Purpose:

Incident overview

Contains:

* active incidents
* prediction card
* memory statistics

---

## Screen 2

Analysis

Purpose:

Agent response

Contains:

* incident details
* reasoning
* confidence score

---

## Screen 3

Timeline

Purpose:

Visual learning journey

Contains:

* incidents
* observations
* prediction formation

---

## Screen 4

Live Learning

Purpose:

Proof of memory accumulation

Contains:

* new incident
* retain action
* recall action

---

# Database Design

SQLite used only for application state.

Hindsight remains primary memory source.

---

Table:

incidents

Fields:

id
title
service
severity
status
description
resolution
created_at

---

Table:

predictions

Fields:

id
prediction
confidence
service
created_at

---

Table:

demo_state

Fields:

id
current_stage
history_loaded
last_reset

---

# API Design

Phase 2 APIs

GET /health

GET /incidents

POST /incidents

GET /incidents/{id}

POST /incidents/{id}/resolve

---

Future APIs

POST /memory/retain

POST /memory/recall

POST /memory/reflect

GET /timeline

GET /predictions

POST /demo/fast-forward

POST /demo/reset

---

# Demo Journey

Act 1

New Agent

No memories

Confidence = 0%

---

Act 2

30 Day History Loaded

Patterns emerge

Observations appear

---

Act 3

Prediction Generated

Confidence increases

---

Act 4

Live Learning

Unknown incident

Resolution retained

Incident repeated

Agent recalls fix

---

# Guiding Rule

The project is not a dashboard.

The project is not a chatbot.

The project is a demonstration of memory-driven learning.

Every implementation decision should strengthen that narrative.
