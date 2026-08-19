from fastapi import FastAPI

from app.db.database import Base, engine
from app.db import models
from app.routers import exercises
from app.schemas.common import RootResponse, HealthResponse


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Adaptive Fitness Intelligence API",
    description="Backend API for the Adaptive Fitness Intelligence Platform",
    version="0.1.0",
)


app.include_router(exercises.router)


@app.get(
    "/",
    response_model=RootResponse,
    summary="API information",
)
def root():
    return {
        "message": "Adaptive Fitness Intelligence API",
        "version": "0.1.0",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Check API health",
)
def health_check():
    return {"status": "healthy"}
