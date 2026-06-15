# context.md

# Project: Nexus Sentinel

## Project Summary

Nexus Sentinel is an AI-powered Incident Intelligence Agent built for the Hindsight Hackathon.

The goal is to demonstrate how persistent memory can help engineering teams resolve incidents faster, learn from previous outages, identify recurring patterns, and preserve organizational knowledge.

The project is designed around one central idea:

> The agent should become more useful after every incident it experiences.

Memory is the primary product feature.

---

# Current Development Philosophy

This project will be built incrementally.

DO NOT attempt to generate the entire project at once.

DO NOT create features that have not been explicitly requested.

DO NOT make architectural assumptions beyond the current task.

Every implementation step will be provided separately.

Only focus on the task currently assigned.

---

# Core Story

The product demonstrates four concepts:

1. Remember
2. Learn
3. Predict
4. Preserve Knowledge

Every feature must support at least one of these concepts.

If a feature does not strengthen these concepts, it should not be implemented.

---

# Target Users

* Site Reliability Engineers
* DevOps Engineers
* Engineering Managers

---

# Technology Stack

Frontend:

* React
* TypeScript
* Vite
* TailwindCSS

Backend:

* FastAPI
* Python

AI:

* Groq

Memory:

* Hindsight Cloud

Storage:

* SQLite

---

# Development Rules

1. Build only the requested scope.
2. Prefer simple implementations over complex abstractions.
3. Avoid premature optimization.
4. Avoid adding extra features.
5. Avoid creating files that were not requested.
6. Keep the codebase modular and easy to understand.
7. Prioritize hackathon speed and demo quality.

---

# Current Phase

PHASE: PROJECT INITIALIZATION

Only work on:

* project structure
* development environment
* dependencies
* basic application scaffolding

Do NOT build:

* business logic
* memory integrations
* prediction systems
* dashboards
* UI features
* agent workflows

unless explicitly requested later.

---

# Success Metric

The project succeeds when judges can clearly observe that the system becomes smarter over time through memory accumulation.

This document is intentionally high-level.

Detailed architecture, APIs, database schema, memory design, and implementation plans will be provided separately during development.
