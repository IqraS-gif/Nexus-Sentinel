Read the following documents before making changes:

* docs/context.md
* docs/architecture.md
* docs/phase-2.md

We are currently in Phase 2 only.

Important restrictions:

DO NOT implement:

* Hindsight integration
* Groq integration
* prediction engine
* timeline engine
* memory systems
* frontend features

Task:

Implement the complete Phase 2 backend foundation.

Requirements:

1. Create SQLAlchemy models:

   * Incident
   * DemoState

2. Create enums:

   * SeverityEnum
   * StatusEnum
   * DemoStageEnum

3. Create Pydantic schemas:

   * IncidentCreate
   * IncidentUpdate
   * IncidentResponse
   * DemoStateResponse

4. Create service layer:

   * IncidentService
   * DemoService

5. Create API routers under:
   app/api/v1/

6. Implement endpoints:

   GET /health

   GET /api/v1/incidents

   POST /api/v1/incidents

   GET /api/v1/incidents/{id}

   POST /api/v1/incidents/{id}/resolve

   GET /api/v1/demo-state

   POST /api/v1/demo-state/reset

7. Configure automatic table creation.

8. Register routers in FastAPI.

9. Verify Swagger docs work correctly.

Output:

* Show updated folder structure.
* Explain architecture decisions.
* Show all created files.
* Stop immediately after completing Phase 2.

Do not proceed to Phase 3.
