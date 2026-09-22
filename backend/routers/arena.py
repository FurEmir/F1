"""Kuantum Arenası — live game lobby. Teacher hosts a room (PIN + QR); students join from
their own device. Privacy: only detective code + nickname ever enter the lobby list."""

import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.arena_content import ROUNDS, public_round, score_answer
from lib.auth import require_role, require_user
from lib.db import db
from models.game import ArenaAnswerInput, ArenaJoinResult, ArenaRoom, ArenaState, Ok

router = APIRouter()

ROOM_TTL = timedelta(hours=6)

SYNTHETIC_NICKS = [
    "NeonFoton", "GizliIzotop", "AltınSaçılım", "OrbitalBulut", "GamaIşını", "KuantumTilki",
    "SpektrumAvcı", "NötronGezgini", "KatotKâşifi", "ÇekirdekNöbeti", "DeltaPiksel", "FotonKedi",
]


def _new_pin() -> str:
    return "KD-" + "".join(random.choices(string.digits, k=4))


def _room_out(doc: dict) -> ArenaRoom:
    return ArenaRoom(
        id=doc["id"],
        pin=doc["pin"],
        status=doc.get("status", "open"),
        players=[
            {
                "code": p.get("code", "?"),
                "nickname": p.get("nickname"),
                "joined_at": p.get("joined_at"),
                "synthetic": bool(p.get("synthetic", False)),
            }
            for p in doc.get("players", [])
        ],
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
    )


async def _active_room(pin: str) -> dict:
    doc = await db.arena_rooms.find_one({"pin": pin.strip().upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Arena odası bulunamadı. PIN'i kontrol edin.")
    if doc.get("status") == "closed":
        raise HTTPException(status_code=410, detail="Bu arena odası kapatıldı.")
    return doc


@router.post("/create", response_model=ArenaRoom)
async def create_room(user: dict = Depends(require_role("teacher", "admin"))):
    # one open room per host keeps the smartboard flow unambiguous
    await db.arena_rooms.update_many(
        {"teacher_id": user["id"], "status": "open"}, {"$set": {"status": "closed"}}
    )
    pin = _new_pin()
    while await db.arena_rooms.find_one({"pin": pin, "status": "open"}):
        pin = _new_pin()
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "pin": pin,
        "teacher_id": user["id"],
        "class_id": user.get("class_id"),
        "status": "open",
        "players": [],
        "created_at": now,
        "expires_at": now + ROOM_TTL,
    }
    await db.arena_rooms.insert_one(doc)
    return _room_out(doc)


@router.get("/current", response_model=ArenaRoom | None)
async def current_room(user: dict = Depends(require_role("teacher", "admin"))):
    doc = await db.arena_rooms.find_one({"teacher_id": user["id"], "status": "open"})
    return _room_out(doc) if doc else None


@router.get("/{pin}/lobby", response_model=ArenaRoom)
async def lobby(pin: str, user: dict = Depends(require_user)):
    return _room_out(await _active_room(pin))


@router.post("/{pin}/join", response_model=ArenaJoinResult)
async def join_room(pin: str, user: dict = Depends(require_user)):
    doc = await _active_room(pin)
    already = any(p.get("code") == user["code"] for p in doc.get("players", []))
    if not already:
        await db.arena_rooms.update_one(
            {"id": doc["id"]},
            {"$push": {"players": {
                "code": user["code"],
                "nickname": user.get("nickname"),
                "joined_at": datetime.now(timezone.utc),
                "synthetic": False,
            }}},
        )
        doc = await db.arena_rooms.find_one({"id": doc["id"]}) or doc
    return ArenaJoinResult(
        joined=True,
        already_joined=already,
        pin=doc["pin"],
        player_count=len(doc.get("players", [])),
    )


@router.post("/{pin}/demo-join", response_model=ArenaRoom)
async def demo_join(pin: str, user: dict = Depends(require_role("teacher", "admin"))):
    """Adds one synthetic detective — used to demo the lobby flow on the smartboard."""
    doc = await _active_room(pin)
    used = {p.get("nickname") for p in doc.get("players", [])}
    nick = next((n for n in SYNTHETIC_NICKS if n not in used), f"Dedektif{random.randint(10, 99)}")
    await db.arena_rooms.update_one(
        {"id": doc["id"]},
        {"$push": {"players": {
            "code": f"KD-{random.randint(2001, 2099)}",
            "nickname": nick,
            "joined_at": datetime.now(timezone.utc),
            "synthetic": True,
        }}},
    )
    return _room_out(await db.arena_rooms.find_one({"id": doc["id"]}))


@router.post("/{pin}/close", response_model=Ok)
async def close_room(pin: str, user: dict = Depends(require_role("teacher", "admin"))):
    doc = await _active_room(pin)
    await db.arena_rooms.update_one({"id": doc["id"]}, {"$set": {"status": "closed"}})
    return Ok(detail="Arena odası kapatıldı.")


# ------------------------------------------------------------------ live rounds
def _scoreboard(doc: dict) -> list[dict]:
    totals: dict[str, dict] = {}
    for p in doc.get("players", []):
        totals[p["code"]] = {"code": p["code"], "nickname": p.get("nickname"), "score": 0, "correct": 0, "answers": 0}
    for a in doc.get("answers", []):
        row = totals.setdefault(a["code"], {"code": a["code"], "nickname": a.get("nickname"), "score": 0, "correct": 0, "answers": 0})
        row["score"] += int(a.get("points", 0))
        row["correct"] += 1 if a.get("correct") else 0
        row["answers"] += 1
    ranked = sorted(totals.values(), key=lambda r: (-r["score"], r["code"]))
    for i, r in enumerate(ranked):
        r["rank"] = i + 1
    return ranked


def _state_out(doc: dict, viewer_code: str | None, is_host: bool) -> ArenaState:
    status = doc.get("status", "open")
    idx = int(doc.get("round_index", 0))
    reveal = status in ("reveal", "finished") or is_host
    current = public_round(idx, reveal) if status in ("in_round", "reveal") and idx < len(ROUNDS) else None
    answers_this_round = [a for a in doc.get("answers", []) if a.get("round") == idx]
    mine = next((a for a in answers_this_round if a.get("code") == viewer_code), None)
    return ArenaState(
        pin=doc["pin"],
        status=status,
        round_index=idx,
        total_rounds=len(ROUNDS),
        current_round=current,
        players=[
            {
                "code": p.get("code", "?"),
                "nickname": p.get("nickname"),
                "joined_at": p.get("joined_at"),
                "synthetic": bool(p.get("synthetic", False)),
            }
            for p in doc.get("players", [])
        ],
        answers_count=len(answers_this_round),
        round_answers=[
            {
                "code": a["code"],
                "nickname": a.get("nickname"),
                "choice": a.get("choice", ""),
                "justification": a.get("justification", ""),
                "correct": bool(a.get("correct")),
                "points": int(a.get("points", 0)),
            }
            for a in answers_this_round
        ]
        if (is_host and status in ("reveal", "finished"))
        else [],
        my_answer=(
            {
                "code": mine["code"],
                "nickname": mine.get("nickname"),
                "choice": mine.get("choice", ""),
                "justification": mine.get("justification", ""),
                "correct": bool(mine.get("correct")),
                "points": int(mine.get("points", 0)),
            }
            if mine
            else None
        ),
        my_notes=list(mine.get("notes", [])) if mine else [],
        scoreboard=_scoreboard(doc),
        round_started_at=doc.get("round_started_at"),
    )


@router.get("/{pin}/state", response_model=ArenaState)
async def state(pin: str, user: dict = Depends(require_user)):
    doc = await _active_room(pin)
    is_host = user.get("role") in ("teacher", "admin") and doc.get("teacher_id") == user["id"]
    return _state_out(doc, user.get("code"), is_host)


@router.post("/{pin}/start", response_model=ArenaState)
async def start_round(pin: str, user: dict = Depends(require_role("teacher", "admin"))):
    doc = await _active_room(pin)
    if not doc.get("players"):
        raise HTTPException(status_code=409, detail="Henüz bağlanan dedektif yok. En az bir katılımcı bekleyin.")
    await db.arena_rooms.update_one(
        {"id": doc["id"]},
        {"$set": {
            "status": "in_round",
            "round_index": 0,
            "round_started_at": datetime.now(timezone.utc),
            "answers": [],
        }},
    )
    doc = await db.arena_rooms.find_one({"id": doc["id"]})
    return _state_out(doc, user.get("code"), True)


@router.post("/{pin}/reveal", response_model=ArenaState)
async def reveal_round(pin: str, user: dict = Depends(require_role("teacher", "admin"))):
    doc = await _active_room(pin)
    if doc.get("status") != "in_round":
        raise HTTPException(status_code=409, detail="Açık bir tur yok.")
    await db.arena_rooms.update_one({"id": doc["id"]}, {"$set": {"status": "reveal"}})
    doc = await db.arena_rooms.find_one({"id": doc["id"]})
    return _state_out(doc, user.get("code"), True)


@router.post("/{pin}/next", response_model=ArenaState)
async def next_round(pin: str, user: dict = Depends(require_role("teacher", "admin"))):
    doc = await _active_room(pin)
    idx = int(doc.get("round_index", 0))
    if idx + 1 >= len(ROUNDS):
        await db.arena_rooms.update_one({"id": doc["id"]}, {"$set": {"status": "finished"}})
    else:
        await db.arena_rooms.update_one(
            {"id": doc["id"]},
            {"$set": {
                "status": "in_round",
                "round_index": idx + 1,
                "round_started_at": datetime.now(timezone.utc),
            }},
        )
    doc = await db.arena_rooms.find_one({"id": doc["id"]})
    return _state_out(doc, user.get("code"), True)


@router.post("/{pin}/answer", response_model=ArenaState)
async def answer(pin: str, body: ArenaAnswerInput, user: dict = Depends(require_user)):
    doc = await _active_room(pin)
    if doc.get("status") != "in_round":
        raise HTTPException(status_code=409, detail="Şu an açık bir tur yok.")
    idx = int(doc.get("round_index", 0))
    valid = {o["id"] for o in ROUNDS[idx]["options"]}
    if body.choice not in valid:
        raise HTTPException(status_code=422, detail="Geçersiz kanıt seçimi.")
    if any(a.get("round") == idx and a.get("code") == user["code"] for a in doc.get("answers", [])):
        raise HTTPException(status_code=409, detail="Bu tur için kanıtını zaten sundun.")

    started = doc.get("round_started_at") or datetime.now(timezone.utc)
    if isinstance(started, datetime):
        elapsed = (datetime.now(timezone.utc) - started.replace(tzinfo=timezone.utc)).total_seconds()
    else:
        elapsed = 0.0
    points, correct, notes = score_answer(idx, body.choice, body.justification, elapsed)

    # auto-join anyone answering from a shared device flow
    if not any(p.get("code") == user["code"] for p in doc.get("players", [])):
        await db.arena_rooms.update_one(
            {"id": doc["id"]},
            {"$push": {"players": {
                "code": user["code"], "nickname": user.get("nickname"),
                "joined_at": datetime.now(timezone.utc), "synthetic": False,
            }}},
        )

    await db.arena_rooms.update_one(
        {"id": doc["id"]},
        {"$push": {"answers": {
            "round": idx,
            "code": user["code"],
            "nickname": user.get("nickname"),
            "choice": body.choice,
            "justification": body.justification.strip(),
            "correct": correct,
            "points": points,
            "notes": notes,
            "at": datetime.now(timezone.utc),
        }}},
    )
    doc = await db.arena_rooms.find_one({"id": doc["id"]})
    return _state_out(doc, user.get("code"), False)
