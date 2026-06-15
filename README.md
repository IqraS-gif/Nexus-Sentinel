# 🛡️ Nexus Sentinel

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
</p>

<p align="center">
  <strong>The Persistent AI Incident Intelligence Agent That Never Forgets.</strong><br />
  Powered by <strong>Hindsight Cloud</strong> vector memory and <strong>Groq (Llama-3.1)</strong>.
</p>

---

## 📌 Problem Statement
In modern DevOps environments, on-call teams are constantly overwhelmed by repetitive alerts, transient service failures, and critical system incidents. When an outage occurs, engineers waste valuable hours query-hunting logs, searching stale playbooks, and manually tracing root causes, completely detached from historical incident knowledge. The lack of a unified, persistent memory engine means that whenever a resolved issue resurfaces, teams must troubleshoot it from scratch, leading to high Mean Time to Resolution (MTTR), recurring configuration drift, and severe developer fatigue.

## 💡 Solution Brief
**Nexus Sentinel** is an autonomous incident intelligence platform that acts as a co-pilot for on-call engineers. It continuously scans live alert sources (such as GitHub issues, AWS Status feeds, or custom raw server logs), auto-classifies the incident type and severity, and links it directly to historical knowledge. The core agent reads incoming telemetry, runs semantic search across previous incident reviews, and serves real-time diagnostics, playbooks, and structural reasoning to immediately guide engineers through mitigation, reducing resolution times from hours to minutes.

---

## 🧠 How We Uniquely Used Hindsight Cloud
Instead of standard document search or a static knowledge base, we leveraged **Hindsight Cloud** (Vectorize's AI vector memory database) as a dynamic, real-time learning engine for DevOps:

```mermaid
graph TD
    A[Telemetry Alert / Raw Logs] --> B[FastAPI Engine]
    B --> C[Groq Auto-Classifier]
    C -->|Infer Service & Severity| D[Hindsight Vector Database]
    D -->|arecall: semantic similarity| E[Retrieved Historical Memories]
    E --> F[areflect: structured LLM reasoning]
    F -->|Confidence Score & Root Cause| G[Interactive Copilot Dashboard]
    G -->|On-Call Engineer Resolves| H[aretain: new post-mortem memory]
    H -->|Saves in Database| D
```

### 1. Dynamic Incident Retention (`.aretain`)
> [!NOTE]
> When an engineer resolves an incident on our platform, the post-mortem analysis (including the title, symptoms, root cause, and verified configuration resolution steps) is automatically vectorized and saved into the Hindsight database. The agent literally *learns* in real-time from human resolutions.

### 2. Semantic Similarity-Based Recall (`.arecall`)
> [!TIP]
> Instead of keyword searches which fail on complex system logs, Nexus Sentinel performs a semantic search. When raw logs or error details are fed into the system, Hindsight searches the vector embeddings of historical incidents (including our 502 DevOps dataset records) to surface matching patterns, even if the error logs are formatted differently or contain different variables.

### 3. Retrieval-Augmented Reflection (`.areflect`)
> [!IMPORTANT]
> We leverage Hindsight's reasoning engine. Instead of just showing raw search results, Nexus Sentinel feeds retrieved facts into a structured reflection schema. This prompts the AI memory to synthesize *evidence-based reasoning* and output exact *actionable playbooks*, complete with a confidence score derived from the density of past vector matches.

---

## 📊 Traditional Response vs. Nexus Sentinel

| Metric / Feature | Traditional Incident Response | Nexus Sentinel + Hindsight |
| :--- | :--- | :--- |
| **Investigation Speed** | 2+ hours searching logs & querying peers | **Under 8 minutes** via automated recall |
| **Playbook Accuracy** | Stale static documents or no docs | **Real-time, dynamic recommendations** |
| **Knowledge Base** | Unused wiki pages | **Self-learning vector memory** |
| **Alert Diagnostics** | Raw log dumps and stack traces | **Auto-classified severity & context** |

---

## ⚡ Key Features

* **Vibrant Tech Dashboard**: A futuristic, light-themed tech dashboard with animated grid matrix backdrops, floating scanning elements, and responsive gradient layers.
* **Continuous Seeding & Knowledge Injection**: Includes a one-time setup that parses a historical DevOps dataset of **502 incidents** directly into Hindsight's vector space.
* **Auto-Classification Pipeline**: Uses Groq to parse raw unstructured logs, metrics, or natural language alerts into structured objects (affected service, type, severity, and root cause hypothesis).
* **Live DevOps Alerts Feed**: Direct integrations with GitHub actions (ci-failures/issues) and public status APIs (Stripe, Cloudflare, GitHub, AWS RSS feeds).
* **Interactive Investigation Console**: Fully featured debugging playground where engineers can query the AI Copilot, inspect confidence levels, review matched services, and retrieve Playbook recommendations.

---

## 🛠️ Tech Stack

* **Frontend**: React, TypeScript, TailwindCSS, Lucide Icons, Vite, Lenis Smooth Scroll.
* **Backend**: FastAPI (Python), SQLite (SQLAlchemy), Pydantic Settings.
* **AI & Memory**: Hindsight Python SDK, Groq API (Llama-3.1-8b).

---

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -e .
   ```
4. Set up environment variables in `backend/.env` (using keys for Hindsight, Groq, and GitHub).
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

*Nexus Sentinel © 2026. Powered by Hindsight Cloud.*
