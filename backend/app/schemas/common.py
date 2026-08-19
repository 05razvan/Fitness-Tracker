from pydantic import BaseModel


class RootResponse(BaseModel):
    message: str
    version: str


class HealthResponse(BaseModel):
    status: str
