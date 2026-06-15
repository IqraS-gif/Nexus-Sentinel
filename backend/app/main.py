from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Register models for metadata creation

# Create database tables automatically
Base.metadata.create_all(bind=engine)

from app.api.v1.incidents import router as incidents_router
from app.api.v1.demo import router as demo_router
from app.api.v1.memory import router as memory_router
from app.api.v1.observations import router as observations_router
from app.api.v1.timeline import router as timeline_router
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.detection import router as detection_router

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# Set up CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 routes
app.include_router(incidents_router, prefix="/api/v1")
app.include_router(demo_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")
app.include_router(observations_router, prefix="/api/v1")
app.include_router(timeline_router, prefix="/api/v1")
app.include_router(intelligence_router, prefix="/api/v1")
app.include_router(copilot_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(detection_router, prefix="/api/v1")




@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
