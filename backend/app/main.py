from fastapi import FastAPI

app = FastAPI(
    title="Adaptive Fitness Intelligence API",
    description="Backend API for the Adaptive Fitness Intelligence Platform",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "Adaptive Fitness Intelligence API",
        "version": "0.1.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}