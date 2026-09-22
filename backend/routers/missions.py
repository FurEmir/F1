"""Mission catalog + progress/XP engine. All XP is server-authoritative (never sent by the client)."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_user
from lib.content import (
    BADGE_RULES,
    BADGES,
    MISSION_META,
    MISSION_ORDER,
    MISSION_PREREQS,
    MISSION_TASKS,
    XP_KEY_TO_MISSION,
    is_mission_completed,
    level_for,
)
from lib.db import db
from models.game import BadgeOut, MissionCompleteInput, MissionCompleteResult, MissionStatus, Ok

router = APIRouter()

EB_MISSION = "evidence-board"  # XP rows live here, hidden from the catalog


async def task_keys_for(user_id: str) -> tuple[set[str], int]:
    docs = await db.progress.find({"user_id": user_id}).to_list(1000)
    keys = {d["task_key"] for d in docs}
    xp = sum(int(d.get("xp", 0)) for d in docs)
    return keys, xp


async def mission_states(user_id: str) -> list[dict]:
    keys, xp_by = set(), 0
    docs = await db.progress.find({"user_id": user_id}).to_list(1000)
    keys = {d["task_key"] for d in docs}
    xp_sum = sum(int(d.get("xp", 0)) for d in docs)
    done_tasks: dict[str, set[str]] = {m: set() for m in MISSION_ORDER}
    xp_per_mission: dict[str, int] = {m: 0 for m in MISSION_ORDER}
    for d in docs:
        mid = d.get("mission_id")
        if mid in done_tasks:
            done_tasks[mid].add(d["task_key"])
            xp_per_mission[mid] += int(d.get("xp", 0))

    states: list[dict] = []
    prereq_ok: dict[str, bool] = {}
    for i, mid in enumerate(MISSION_ORDER):
        meta = MISSION_META[mid]
        required = {tk for tk, _ in MISSION_TASKS[mid]}
        completed = required <= done_tasks[mid]
        prereq_done = all(prereq_ok.get(p, False) for p in MISSION_PREREQS[mid])
        status = "completed" if completed else ("available" if prereq_done else "locked")
        prereq_ok[mid] = completed
        states.append({
            "id": mid,
            "order": i + 1,
            "code": meta["code"],
            "title": meta["title"],
            "scientist": meta["scientist"],
            "year": meta["year"],
            "status": status,
            "xp_earned": xp_per_mission[mid],
            "xp_total": sum(xp for _, xp in MISSION_TASKS[mid]),
            "tasks_done": sorted(done_tasks[mid]),
        })
    return states


async def completed_required_missions(user_id: str) -> int:
    states = await mission_states(user_id)
    required = ["karanlik-kutu", "dalton-dosyasi", "thomson-izi", "rutherford-operasyonu", "bohr-sirri", "chadwick-dosyasi"]
    return sum(1 for s in states if s["id"] in required and s["status"] == "completed")


async def register_task(user: dict, mission_id: str, task_key: str, answers: dict[str, str] | None = None, xp_override: int | None = None) -> tuple[int, list[str]]:
    """Record one task completion (idempotent). Returns (xp_awarded, new_badge_ids)."""
    existing = await db.progress.find_one({"user_id": user["id"], "mission_id": mission_id, "task_key": task_key})
    if existing:
        return 0, []

    xp = xp_override if xp_override is not None else next((x for k, x in MISSION_TASKS.get(mission_id, [])), 0)
    await db.progress.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "mission_id": mission_id,
        "task_key": task_key,
        "answers": answers or {},
        "xp": xp,
        "created_at": datetime.now(timezone.utc),
    })

    new_badges: list[str] = []
    if xp:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"xp": xp}})
    if mission_id in MISSION_TASKS:  # evidence-board rows don't drive badges
        user_badges = set(user.get("badges", []))
        for b in BADGE_RULES.get(task_key, []):
            if b not in user_badges:
                user_badges.add(b)
                new_badges.append(b)
    if new_badges:
        await db.users.update_one({"id": user["id"]}, {"$addToSet": {"badges": {"$each": new_badges}}})
    return xp, new_badges


@router.get("", response_model=list[MissionStatus])
async def list_missions(user: dict = Depends(require_user)):
    states = await mission_states(user["id"])
    return [MissionStatus(**s) for s in states]


@router.get("/{mission_id}/progress")
async def mission_progress(mission_id: str, user: dict = Depends(require_user)):
    if mission_id not in MISSION_TASKS:
        raise HTTPException(status_code=404, detail="Görev bulunamadı.")
    docs = await db.progress.find(
        {"user_id": user["id"], "mission_id": mission_id}, {"_id": 0, "task_key": 1, "answers": 1, "created_at": 1}
    ).to_list(100)
    return {"tasks": docs}


@router.post("/{mission_id}/complete", response_model=MissionCompleteResult)
async def complete_mission(mission_id: str, body: MissionCompleteInput, user: dict = Depends(require_user)):
    if mission_id not in MISSION_TASKS:
        raise HTTPException(status_code=404, detail="Görev bulunamadı.")
    valid_keys = {tk for tk, _ in MISSION_TASKS[mission_id]}
    if body.task_key not in valid_keys:
        raise HTTPException(status_code=422, detail=f"Geçersiz görev adımı: {body.task_key}")

    xp_awarded, new_badges = await register_task(user, mission_id, body.task_key, body.answers)

    if body.answers:
        await db.mission_answers.insert_one({
            "user_id": user["id"],
            "class_id": user.get("class_id"),
            "mission_id": mission_id,
            "task_key": body.task_key,
            "answers": body.answers,
            "created_at": datetime.now(timezone.utc),
        })

    fresh = await db.users.find_one({"id": user["id"]})
    total = int(fresh.get("xp", 0))
    level, title = level_for(total)
    required = {tk for tk, _ in MISSION_TASKS[mission_id]}
    keys, _ = await task_keys_for(user["id"])
    status = "completed" if required <= keys else "available"
    return MissionCompleteResult(
        xp_awarded=xp_awarded,
        total_xp=total,
        level=level,
        level_title=title,
        mission_status=status,
        badges_awarded=[BadgeOut(**BADGES[b].model_dump()) for b in new_badges],
    )
