from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Dict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url: str = os.environ["MONGO_URL"]
client: AsyncIOMotorClient = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="VEDED Creative Suite + BookStream API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "VEDED Creative Suite API", "status": "ok"}


@api_router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "healthy"}


app.include_router(api_router)

from routes_auth import build_router as auth_router
from routes_veded import build_router as veded_router
from routes_bookstream import build_router as bookstream_router
from routes_payments import build_router as payments_router

app.include_router(auth_router(db))
app.include_router(veded_router(db))
app.include_router(bookstream_router(db))
app.include_router(payments_router(db))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("veded")


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
