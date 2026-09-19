from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, events, resources, venues, predictions, optimization, reports, history, institution, settings
from app.core.config import settings as app_settings

app = FastAPI(
    title="HackWell — Event Planning API",
    description="Smart Event Planning & Resource Optimization Platform",
    version="2.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(resources.router)
app.include_router(venues.router)
app.include_router(predictions.router)
app.include_router(optimization.router)
app.include_router(reports.router)
app.include_router(history.router)
app.include_router(institution.router)
app.include_router(settings.router)


@app.get("/")
async def root():
    return {"message": "HackWell API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
