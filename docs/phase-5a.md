# phase-5a.md

# Phase 5A — Frontend Foundation & Demo Experience

Status: Approved

Goal:

Create a frontend experience that clearly demonstrates how Nexus Sentinel learns from operational incidents over time.

The frontend should prioritize storytelling and intelligence visibility over analytics dashboards.

---

# Core User Flows

## Flow 1

Guided Demo

Purpose:

Allow judges to experience the complete learning journey in less than 60 seconds.

---

## Flow 2

Manual Exploration

Purpose:

Allow judges to test every feature independently.

---

# Page Structure

LandingPage

DemoExperiencePage

CommandCenterPage

IncidentAnalysisPage

TimelinePage

ObservationsPage

---

# Landing Page

Purpose:

Explain the product in under 10 seconds.

Hero:

Nexus Sentinel

Every Incident Makes The System Smarter.

Primary CTA:

Start Interactive Demo

Secondary CTA:

Explore Platform

---

# Demo Experience Page

Purpose:

Guide judges through:

1. Incident Creation
2. Memory Retention
3. Memory Recall
4. Reflection
5. Observation Formation
6. Intelligence Report

Each step should contain:

Description

Real Backend Data

Next Step Button

---

# Command Center

Purpose:

Operational Overview

Sections:

Active Incidents

Memory Statistics

Observation Statistics

Recent Learning Events

Quick Actions

---

# Incident Analysis Page

Purpose:

Show intelligence generation.

Sections:

Incident Details

Similar Incidents

Reflection Output

Groq Intelligence Report

Confidence Score

---

# Timeline Page

Purpose:

Visualize learning progression.

Sections:

Chronological Events

Observation Evolution

Confidence Growth

Learning Journey

---

# Observations Page

Purpose:

Display discovered patterns.

Sections:

Observation Cards

Evidence Count

Related Incidents

Confidence Score

---

# Navigation

Top Navigation:

Command Center

Timeline

Observations

Demo

---

# Design System

Theme:

Dark Enterprise

Inspired By:

Linear

Grafana

Datadog

Vercel

---

# Colors

Background:
#0B1020

Surface:
#121826

Border:
#263244

Primary:
#3B82F6

Success:
#22C55E

Warning:
#F59E0B

Critical:
#EF4444

Text:
#F8FAFC

Muted:
#94A3B8

---

# Component Hierarchy

Layout

Navbar

Sidebar

PageContainer

Cards

IncidentCard

ObservationCard

MemoryStatCard

TimelineEventCard

ReportCard

---

# API Mapping

Landing Page

No API

---

Command Center

GET /api/v1/incidents

GET /api/v1/observations

GET /api/v1/timeline

---

Analysis Page

POST /api/v1/incidents/{id}/analyze

POST /api/v1/incidents/{id}/report

---

Timeline Page

GET /api/v1/timeline

---

Observations Page

GET /api/v1/observations

---

# Hackathon Rule

Frontend should never simulate intelligence.

All intelligence must come from backend APIs.
