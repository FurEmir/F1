"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "users": [
        IndexModel([("code", ASCENDING)], name="code", unique=True),
        IndexModel([("role", ASCENDING), ("class_id", ASCENDING)], name="role_class"),
    ],
    "sessions": [
        IndexModel([("token", ASCENDING)], name="token", unique=True),
        IndexModel([("user_id", ASCENDING)], name="user_id"),
    ],
    "progress": [
        IndexModel([("user_id", ASCENDING), ("mission_id", ASCENDING), ("task_key", ASCENDING)],
                   name="user_mission_task", unique=True),
    ],
    "mission_answers": [
        IndexModel([("class_id", ASCENDING), ("created_at", DESCENDING)], name="class_created"),
    ],
    "evidence_boards": [
        IndexModel([("user_id", ASCENDING)], name="user_id", unique=True),
    ],
    "jigsaw_notes": [
        IndexModel([("user_id", ASCENDING)], name="user_id", unique=True),
    ],
    "submissions": [
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"),
        IndexModel([("class_id", ASCENDING), ("created_at", DESCENDING)], name="class_created"),
    ],
    "mentor_messages": [
        IndexModel([("user_id", ASCENDING), ("created_at", ASCENDING)], name="user_created"),
    ],
    "arena_rooms": [
        IndexModel([("pin", ASCENDING)], name="pin"),
        IndexModel([("teacher_id", ASCENDING), ("status", ASCENDING)], name="teacher_status"),
    ],
    "settings": [],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
