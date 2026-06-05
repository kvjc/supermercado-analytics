from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers import analytics, lookup, metadata, recommendations, segmentation, summary

app = FastAPI(
    title="SAT API",
    description="Supermarket Analytics & Transactions API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "success", "data": {"status": "ok", "service": "SAT API"}, "message": None}


app.include_router(summary.router)
app.include_router(analytics.router)
app.include_router(segmentation.router)
app.include_router(recommendations.router)
app.include_router(metadata.router)
app.include_router(lookup.router)
