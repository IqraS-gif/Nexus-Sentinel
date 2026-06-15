import os
import csv
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional

from app.core.config import settings
from app.memory.client import memory_client
from app.services.intelligence.groq_client import groq_client

logger = logging.getLogger("nexus-sentinel.detection_service")

# The dedicated knowledge-base bank loaded from the CSV
KB_BANK_ID = "devops-kb-bank"

# Incident type → severity mapping for auto-classification
TYPE_SEVERITY_MAP = {
    "Service Outage": "critical",
    "Security Alert": "high",
    "Resource Exhaustion": "high",
    "Database Error": "high",
    "Performance Degradation": "medium",
    "Network Timeout": "medium",
    "Deployment Failure": "medium",
}

# Status page public API endpoints (no auth required)
STATUS_PAGE_SOURCES = [
    {
        "name": "Stripe",
        "url": "https://status.stripe.com/api/v2/incidents.json",
        "service": "Payment-Gateway",
    },
    {
        "name": "Cloudflare",
        "url": "https://www.cloudflarestatus.com/api/v2/incidents.json",
        "service": "gateway",
    },
    {
        "name": "GitHub",
        "url": "https://www.githubstatus.com/api/v2/incidents.json",
        "service": "CI/CD Pipeline",
    },
    {
        "name": "Heroku",
        "url": "https://status.heroku.com/api/v2/incidents.json",
        "service": "Kubernetes Cluster",
    },
]


class DetectionService:

    # ─────────────────────────────────────────────
    # KNOWLEDGE BASE — CSV Ingestion into Hindsight
    # ─────────────────────────────────────────────

    @staticmethod
    def _get_csv_path() -> str:
        return os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "resources",
            "devops_incidents_dataset.csv",
        )

    @staticmethod
    async def seed_knowledge_base() -> Dict:
        """
        Reads devops_incidents_dataset.csv and ingests all 502 incidents
        into the Hindsight 'devops-kb-bank' as vector memories.
        This is a one-time setup operation.
        """
        if not memory_client.client:
            raise RuntimeError("Hindsight client not initialized.")

        csv_path = DetectionService._get_csv_path()
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset CSV not found at: {csv_path}")

        # Ensure bank exists
        try:
            banks_resp = await memory_client.client.banks.list_banks()
            existing_ids = [b.bank_id for b in banks_resp.banks] if hasattr(banks_resp, "banks") else []
            if KB_BANK_ID not in existing_ids:
                logger.info(f"Creating Hindsight bank: {KB_BANK_ID}")
                await memory_client.client.acreate_bank(
                    bank_id=KB_BANK_ID,
                    name="DevOps Historical Knowledge Base"
                )
        except Exception as e:
            logger.warning(f"Bank check/create warning: {str(e)}")

        seeded = 0
        failures = []

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        logger.info(f"Seeding {len(rows)} incidents from CSV into {KB_BANK_ID}...")

        # Retain in batches with small delay to avoid rate limiting
        for i, row in enumerate(rows):
            try:
                incident_id = row.get("Incident_ID", f"INC-{i}")
                service = row.get("Service", "Unknown")
                incident_type = row.get("Incident_Type", "Unknown")
                description = row.get("Description", "")
                root_cause = row.get("Root_Cause", "")
                resolution = row.get("Resolution", "")
                timestamp_str = row.get("Timestamp", "")
                ttr = row.get("Time_To_Resolve_Mins", "0")

                # Parse timestamp
                try:
                    ts = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    ts = datetime.utcnow()

                content = (
                    f"[HISTORICAL INCIDENT]\n"
                    f"ID: {incident_id}\n"
                    f"Service: {service}\n"
                    f"Type: {incident_type}\n"
                    f"Description: {description}\n"
                    f"Root Cause: {root_cause}\n"
                    f"Resolution: {resolution}\n"
                    f"Time To Resolve: {ttr} minutes"
                )

                metadata = {
                    "incident_id": incident_id,
                    "service": service,
                    "incident_type": incident_type,
                    "severity": TYPE_SEVERITY_MAP.get(incident_type, "medium"),
                    "root_cause": root_cause[:200],
                    "resolution": resolution[:200],
                    "time_to_resolve_mins": ttr,
                    "source": "csv_knowledge_base",
                }

                await memory_client.client.aretain(
                    bank_id=KB_BANK_ID,
                    content=content,
                    context=f"historical {service} incident: {incident_type}",
                    timestamp=ts,
                    document_id=f"kb_{incident_id}",
                    metadata=metadata,
                )
                seeded += 1

                # Small delay every 10 records to be nice to the API
                if i > 0 and i % 10 == 0:
                    await asyncio.sleep(0.3)

            except Exception as e:
                logger.warning(f"Failed to seed row {i} ({row.get('Incident_ID')}): {str(e)}")
                failures.append({"row": i, "id": row.get("Incident_ID"), "error": str(e)})

        logger.info(f"KB seeding complete. Seeded: {seeded}, Failures: {len(failures)}")
        return {
            "seeded": seeded,
            "total": len(rows),
            "failures": len(failures),
            "bank_id": KB_BANK_ID,
        }

    @staticmethod
    async def get_kb_status() -> Dict:
        """Check how many memories exist in the devops-kb-bank."""
        if not memory_client.client:
            return {"connected": False, "bank_id": KB_BANK_ID, "status": "disconnected"}
        try:
            banks_resp = await memory_client.client.banks.list_banks()
            existing_ids = [b.bank_id for b in banks_resp.banks] if hasattr(banks_resp, "banks") else []
            return {
                "connected": True,
                "bank_id": KB_BANK_ID,
                "seeded": KB_BANK_ID in existing_ids,
                "status": "ready" if KB_BANK_ID in existing_ids else "not_seeded",
            }
        except Exception as e:
            logger.error(f"KB status check failed: {str(e)}")
            return {"connected": False, "bank_id": KB_BANK_ID, "status": "error", "error": str(e)}

    # ─────────────────────────────────────────────
    # LIVE DATA — GitHub API
    # ─────────────────────────────────────────────

    @staticmethod
    async def fetch_github_feed(limit: int = 10) -> List[Dict]:
        """
        Fetches open issues + failed CI/CD runs from GitHub.
        Uses GITHUB_TOKEN if set, works on public repos without it.
        Defaults to popular DevOps/infra repos if GITHUB_REPO not set.
        """
        import urllib.request
        import urllib.error

        token = settings.GITHUB_TOKEN
        repo = settings.GITHUB_REPO or "kubernetes/kubernetes"

        headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "NexusSentinel/1.0"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        results = []

        # Fetch open issues labeled as bugs/incidents
        try:
            issues_url = f"https://api.github.com/repos/{repo}/issues?state=open&labels=bug&per_page={limit}"
            req = urllib.request.Request(issues_url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                issues = json.loads(resp.read().decode())
                for issue in issues[:limit]:
                    results.append({
                        "source": "github_issues",
                        "source_name": f"GitHub/{repo}",
                        "id": str(issue.get("number")),
                        "title": issue.get("title", ""),
                        "description": (issue.get("body") or "")[:400],
                        "url": issue.get("html_url", ""),
                        "created_at": issue.get("created_at", ""),
                        "labels": [l.get("name") for l in issue.get("labels", [])],
                        "raw_service": _infer_service_from_text(
                            issue.get("title", "") + " " + (issue.get("body") or "")
                        ),
                    })
        except Exception as e:
            logger.warning(f"GitHub issues fetch failed: {str(e)}")

        # If GITHUB_REPO set with token, also fetch failed workflow runs
        if token and settings.GITHUB_REPO:
            try:
                runs_url = f"https://api.github.com/repos/{repo}/actions/runs?status=failure&per_page=5"
                req = urllib.request.Request(runs_url, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode())
                    for run in data.get("workflow_runs", [])[:5]:
                        results.append({
                            "source": "github_ci_failure",
                            "source_name": f"GitHub Actions/{repo}",
                            "id": str(run.get("id")),
                            "title": f"CI Failure: {run.get('name', 'Workflow')} #{run.get('run_number')}",
                            "description": f"Branch: {run.get('head_branch')} | Commit: {run.get('head_sha', '')[:8]} | Trigger: {run.get('event')}",
                            "url": run.get("html_url", ""),
                            "created_at": run.get("created_at", ""),
                            "labels": ["ci-failure", "deployment"],
                            "raw_service": "CI/CD Pipeline",
                        })
            except Exception as e:
                logger.warning(f"GitHub Actions fetch failed: {str(e)}")

        return results

    # ─────────────────────────────────────────────
    # LIVE DATA — Public Status Pages (no auth)
    # ─────────────────────────────────────────────

    @staticmethod
    async def fetch_status_pages(limit: int = 15) -> List[Dict]:
        """
        Fetches live incidents from public Atlassian StatusPage feeds and AWS RSS feed.
        No authentication required — all sources are fully public.
        """
        import urllib.request
        import xml.etree.ElementTree as ET
        import re

        all_incidents = []

        # 1. Fetch public Atlassian status page JSONs
        for source in STATUS_PAGE_SOURCES:
            try:
                req = urllib.request.Request(
                    source["url"],
                    headers={"User-Agent": "NexusSentinel/1.0", "Accept": "application/json"},
                )
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode())

                incidents = data.get("incidents", [])
                for inc in incidents[:5]:
                    # Get latest update text
                    updates = inc.get("incident_updates", [])
                    latest_body = updates[0].get("body", "") if updates else inc.get("name", "")

                    all_incidents.append({
                        "source": "status_page",
                        "source_name": source["name"],
                        "id": inc.get("id", ""),
                        "title": inc.get("name", "No title"),
                        "description": latest_body[:400],
                        "url": inc.get("shortlink", ""),
                        "created_at": inc.get("created_at", ""),
                        "status": inc.get("status", "unknown"),
                        "impact": inc.get("impact", "none"),
                        "raw_service": source["service"],
                        "labels": [inc.get("impact", "none"), source["name"].lower()],
                    })
            except Exception as e:
                logger.warning(f"Status page fetch failed ({source['name']}): {str(e)}")
                all_incidents.append({
                    "source": "status_page",
                    "source_name": source["name"],
                    "id": f"offline-{source['name'].lower()}",
                    "title": f"{source['name']} status page unavailable",
                    "description": f"Could not reach {source['url']}. Service may be fully operational.",
                    "status": "operational",
                    "impact": "none",
                    "raw_service": source["service"],
                    "labels": ["operational"],
                    "url": "",
                    "created_at": "",
                })

        # 2. Fetch AWS RSS feed (Zero Auth)
        try:
            req = urllib.request.Request(
                "https://status.aws.amazon.com/rss/all.rss",
                headers={"User-Agent": "NexusSentinel/1.0"},
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                
                # AWS RSS format: channel -> item -> title, description, link, pubDate
                items = root.findall(".//item")
                for item in items[:5]:
                    title = item.find("title").text if item.find("title") is not None else "AWS Event"
                    desc = item.find("description").text if item.find("description") is not None else ""
                    link = item.find("link").text if item.find("link") is not None else "https://status.aws.amazon.com/"
                    pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
                    
                    if desc:
                        desc = re.sub(r'<[^>]*>', '', desc) # Strip HTML tags
                    
                    all_incidents.append({
                        "source": "status_page",
                        "source_name": "AWS",
                        "id": f"aws-{pub_date}",
                        "title": title,
                        "description": desc[:400],
                        "url": link,
                        "created_at": pub_date,
                        "status": "active" if "resolved" not in title.lower() else "resolved",
                        "impact": "major" if "critical" in title.lower() or "outage" in title.lower() else "minor",
                        "raw_service": "Kubernetes Cluster",
                        "labels": ["aws", "infrastructure"],
                    })
        except Exception as e:
            logger.warning(f"AWS status fetch failed: {str(e)}")
            all_incidents.append({
                "source": "status_page",
                "source_name": "AWS",
                "id": "offline-aws",
                "title": "AWS status page unavailable",
                "description": f"Could not reach AWS status feed. Service may be fully operational.",
                "status": "operational",
                "impact": "none",
                "raw_service": "Kubernetes Cluster",
                "labels": ["operational"],
                "url": "",
                "created_at": "",
            })

        return all_incidents[:limit]

    # ─────────────────────────────────────────────
    # CLASSIFICATION — Groq extracts structured data
    # ─────────────────────────────────────────────

    @staticmethod
    async def classify_input(raw_input: str) -> Dict:
        """
        Uses Groq to extract structured incident fields from any raw text:
        logs, metrics, NL description, JSON alerts, GitHub issue text, etc.
        """
        if not groq_client.client:
            # Fallback: keyword-based classification
            return _keyword_classify(raw_input)

        system_prompt = (
            "You are a DevOps incident classifier. Given raw input (logs, metrics, error messages, "
            "plain English descriptions, or JSON alerts), extract structured incident metadata.\n\n"
            "Output ONLY a valid JSON object with these exact fields:\n"
            "- service: the affected service (e.g. 'Kubernetes Cluster', 'Auth-Service', 'Redis-Cache', "
            "'CI/CD Pipeline', 'Payment-Gateway', 'Analytics-Worker', 'Inventory-DB', 'Kafka-Cluster', "
            "'Frontend-UI', 'User-API', or best guess)\n"
            "- incident_type: one of [Service Outage, Performance Degradation, Network Timeout, "
            "Resource Exhaustion, Security Alert, Database Error, Deployment Failure]\n"
            "- severity: one of [low, medium, high, critical]\n"
            "- title: a concise one-line incident title (max 80 chars)\n"
            "- description: cleaned description of the observed symptoms (max 200 chars)\n"
            "- root_cause_hypothesis: your best guess at root cause based on the input\n\n"
            "If you cannot determine a field, use your best reasonable guess. Never return null."
        )

        user_prompt = f"Classify this DevOps input:\n\n{raw_input[:2000]}"

        try:
            import asyncio

            loop = asyncio.get_event_loop()

            def call_groq():
                return groq_client.client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )

            response = await loop.run_in_executor(None, call_groq)
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.warning(f"Groq classification failed: {str(e)}, using keyword fallback")
            return _keyword_classify(raw_input)

    # ─────────────────────────────────────────────
    # PIPELINE — Full Detect→Recall→Reflect
    # ─────────────────────────────────────────────

    @staticmethod
    async def run_detection_pipeline(raw_input: str, source_meta: Optional[Dict] = None) -> Dict:
        """
        Full Detection Intelligence Pipeline:
        1. Classify raw input with Groq
        2. Recall similar incidents from devops-kb-bank (502 CSV records)
        3. Reflect for reasoning + recommended fix
        4. Return enriched intelligence bundle
        """
        pipeline_steps = []

        # Step 1: Classify
        classification = await DetectionService.classify_input(raw_input)
        pipeline_steps.append({
            "step": 1,
            "name": "CLASSIFY",
            "status": "complete",
            "detail": f"Service: {classification.get('service')} | Type: {classification.get('incident_type')} | Severity: {classification.get('severity')}",
        })

        service = classification.get("service", "Unknown")
        incident_type = classification.get("incident_type", "Unknown")
        severity = classification.get("severity", "medium")
        title = classification.get("title", raw_input[:80])
        description = classification.get("description", raw_input[:200])
        root_cause_hypothesis = classification.get("root_cause_hypothesis", "")

        # Step 2: Recall from KB bank
        similar_incidents = []
        avg_ttr = None
        recall_count = 0

        try:
            if not memory_client.client:
                raise RuntimeError("Hindsight not connected")

            recall_query = f"{title} {description} {incident_type} {service}"
            recall_resp = await memory_client.client.arecall(bank_id=KB_BANK_ID, query=recall_query)

            if hasattr(recall_resp, "results") and recall_resp.results:
                for r in recall_resp.results:
                    meta = getattr(r, "metadata", {}) or {}
                    similar_incidents.append({
                        "id": getattr(r, "id", None),
                        "text": getattr(r, "text", "")[:300],
                        "incident_id": meta.get("incident_id"),
                        "service": meta.get("service"),
                        "incident_type": meta.get("incident_type"),
                        "resolution": meta.get("resolution", ""),
                        "time_to_resolve_mins": meta.get("time_to_resolve_mins"),
                        "root_cause": meta.get("root_cause", ""),
                    })
                recall_count = len(similar_incidents)

                # Compute average TTR from recalled incidents
                ttrs = []
                for si in similar_incidents:
                    try:
                        ttrs.append(int(si.get("time_to_resolve_mins", 0) or 0))
                    except Exception:
                        pass
                if ttrs:
                    avg_ttr = round(sum(ttrs) / len(ttrs))

            pipeline_steps.append({
                "step": 2,
                "name": "RECALL",
                "status": "complete",
                "detail": f"{recall_count} similar historical incidents found" + (f" | Avg TTR: {avg_ttr} mins" if avg_ttr else ""),
            })
        except Exception as e:
            logger.warning(f"Recall step failed: {str(e)}")
            pipeline_steps.append({"step": 2, "name": "RECALL", "status": "skipped", "detail": f"KB unavailable: {str(e)}"})

        # Step 3: Reflect
        reasoning = ""
        recommended_action = root_cause_hypothesis or "Investigate based on classification."
        confidence_score = 0.0
        alert_level = "new_pattern"

        try:
            if not memory_client.client:
                raise RuntimeError("Hindsight not connected")

            schema = {
                "type": "object",
                "properties": {
                    "reasoning": {"type": "string"},
                    "recommended_action": {"type": "string"},
                    "confidence_score": {"type": "number"},
                },
                "required": ["reasoning", "recommended_action", "confidence_score"],
            }

            reflect_query = (
                f"Incident Title: {title}\n"
                f"Description: {description}\n"
                f"Service: {service}\n"
                f"Incident Type: {incident_type}\n"
                f"Severity: {severity}"
            )

            reflect_resp = await memory_client.client.areflect(
                bank_id=KB_BANK_ID,
                query=reflect_query,
                include_facts=True,
                response_schema=schema,
            )

            structured = getattr(reflect_resp, "structured_output", None) or {}
            reasoning = structured.get("reasoning", "")
            recommended_action = structured.get("recommended_action", recommended_action)
            confidence_score = float(structured.get("confidence_score", 0.0))

            if not reasoning and hasattr(reflect_resp, "text") and reflect_resp.text:
                reasoning = reflect_resp.text

            # Derive alert level
            if confidence_score >= 0.7 and severity in ("critical", "high"):
                alert_level = "critical_known"
            elif confidence_score >= 0.4:
                alert_level = "known_pattern"
            else:
                alert_level = "new_pattern"

            pipeline_steps.append({
                "step": 3,
                "name": "REFLECT",
                "status": "complete",
                "detail": f"Confidence: {round(confidence_score * 100)}% | Pattern: {alert_level.replace('_', ' ').title()}",
            })
        except Exception as e:
            logger.warning(f"Reflect step failed: {str(e)}")
            pipeline_steps.append({"step": 3, "name": "REFLECT", "status": "skipped", "detail": f"Reflect unavailable: {str(e)}"})
            if recall_count > 3:
                confidence_score = 0.6
                alert_level = "known_pattern"

        return {
            "classification": {
                "service": service,
                "incident_type": incident_type,
                "severity": severity,
                "title": title,
                "description": description,
            },
            "pipeline_steps": pipeline_steps,
            "similar_incidents": similar_incidents[:5],
            "similar_count": recall_count,
            "avg_time_to_resolve_mins": avg_ttr,
            "confidence_score": confidence_score,
            "reasoning": reasoning,
            "recommended_action": recommended_action,
            "alert_level": alert_level,
            "source_meta": source_meta or {},
        }


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _infer_service_from_text(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["kubernetes", "k8s", "kubelet", "crashloop", "pod", "node"]):
        return "Kubernetes Cluster"
    if any(k in text_lower for k in ["auth", "login", "jwt", "oauth", "ldap", "token"]):
        return "Auth-Service"
    if any(k in text_lower for k in ["redis", "cache", "eviction"]):
        return "Redis-Cache"
    if any(k in text_lower for k in ["kafka", "consumer", "lag", "broker"]):
        return "Kafka-Cluster"
    if any(k in text_lower for k in ["payment", "stripe", "checkout", "transaction"]):
        return "Payment-Gateway"
    if any(k in text_lower for k in ["database", "postgres", "mysql", "sql", "replica", "db"]):
        return "Inventory-DB"
    if any(k in text_lower for k in ["ci", "cd", "pipeline", "jenkins", "deploy", "build", "runner"]):
        return "CI/CD Pipeline"
    if any(k in text_lower for k in ["frontend", "ui", "react", "browser", "css"]):
        return "Frontend-UI"
    if any(k in text_lower for k in ["api", "gateway", "502", "nginx", "rate limit"]):
        return "User-API"
    return "Kubernetes Cluster"


def _keyword_classify(raw_input: str) -> Dict:
    """Keyword-based fallback classifier when Groq is unavailable."""
    text = raw_input.lower()
    service = _infer_service_from_text(raw_input)

    # Detect type
    incident_type = "Performance Degradation"
    if any(k in text for k in ["outage", "down", "unavailable", "502", "503"]):
        incident_type = "Service Outage"
    elif any(k in text for k in ["crashloop", "crash", "oom", "killed", "eviction"]):
        incident_type = "Resource Exhaustion"
    elif any(k in text for k in ["timeout", "latency", "slow", "2000ms"]):
        incident_type = "Network Timeout"
    elif any(k in text for k in ["database", "deadlock", "replication", "query"]):
        incident_type = "Database Error"
    elif any(k in text for k in ["deploy", "build", "pipeline", "ci", "cd"]):
        incident_type = "Deployment Failure"
    elif any(k in text for k in ["security", "tls", "certificate", "ssl", "auth failure"]):
        incident_type = "Security Alert"

    severity = TYPE_SEVERITY_MAP.get(incident_type, "medium")

    title = raw_input.strip().split("\n")[0][:80]
    description = raw_input.strip()[:200]

    return {
        "service": service,
        "incident_type": incident_type,
        "severity": severity,
        "title": title,
        "description": description,
        "root_cause_hypothesis": f"Possible {incident_type.lower()} in {service}. Manual investigation required.",
    }
