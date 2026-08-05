from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routers import auth, webauthn
from app.database import init_db_pool, close_db_pool

app = FastAPI(title="VaultID Backend", version="1.0.0")

# Enable CORS for localhost and 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(webauthn.router)


@app.on_event("startup")
async def startup():
    await init_db_pool()


@app.on_event("shutdown")
async def shutdown():
    await close_db_pool()


# Serve the frontend (TechRush/) from the same origin as the API.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "TechRush"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")