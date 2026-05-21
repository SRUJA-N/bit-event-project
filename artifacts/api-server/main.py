import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import models  # ensures tables are registered

from routes import auth, events, registrations, feedback, reports, analytics

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BIT Event Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api")
app.include_router(events.router,        prefix="/api")
app.include_router(registrations.router, prefix="/api")
app.include_router(feedback.router,      prefix="/api")
app.include_router(reports.router,       prefix="/api")
app.include_router(analytics.router,     prefix="/api")

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/api/healthz")
def health():
    return {"status": "ok"}
