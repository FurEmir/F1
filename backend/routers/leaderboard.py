"""Privacy-first leaderboard: gamified XP metrics only, teacher can toggle it off entirely."""

from fastapi import APIRouter, Depends

from lib.auth import require_user
from lib.content import MISSION_ORDER
from lib.db import db
from models.game import LeaderboardEntry, LeaderboardState

router = APIRouter()


@router.get("/leaderboard", response_model=LeaderboardState)
async def leaderboard(user: dict = Depends(require_user)):
    settings = await db.settings.find_one({"id": "teacher-settings"})
    enabled = (settings or {}).get("leaderboard_enabled", True)
    if not enabled:
        return LeaderboardState(enabled=False, entries=[])

    students = await db.users.find({"role": "student"}).sort("xp", -1).to_list(50)
    progress = await db.progress.find({}, {"user_id": 1, "mission_id": 1}).to_list(5000)
    done: dict[str, set[str]] = {}
    for d in progress:
        if d["mission_id"] in MISSION_ORDER:
            done.setdefault(d["user_id"], set()).add(d["mission_id"])

    entries = [
        LeaderboardEntry(
            rank=i + 1,
            code=s["code"],
            nickname=s.get("nickname"),
            xp=s.get("xp", 0),
            missions_completed=len(done.get(s["id"], set())),
        )
        for i, s in enumerate(students[:20])
    ]
    return LeaderboardState(enabled=True, entries=entries)
