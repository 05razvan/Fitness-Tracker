from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import recommendations, exercises, workouts, presets
from app.schemas.common import RootResponse, HealthResponse


app = FastAPI(
    title="Adaptive Fitness Intelligence API",
    description="Backend API for the Adaptive Fitness Intelligence Platform",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(presets.router)
app.include_router(recommendations.router)


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
