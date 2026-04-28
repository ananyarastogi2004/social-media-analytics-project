from fastapi import FastAPI
from app.config import settings
from app.database import Base, engine

# IMPORT MODELS (VERY IMPORTANT)
from app.models import user, case, post
from app.routes import auth, cases, apify, analytics, auth
from fastapi.middleware.cors import CORSMiddleware




Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(cases.router, prefix="/cases", tags=["Cases"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(apify.router, prefix="/apify", tags=["Apify"])

@app.get("/")
def root():
    return {"message": "🚀 Social Media Analytics API Running"}
