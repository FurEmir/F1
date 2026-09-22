"""Scientific Evidence Board: 5 scientists x 5 fields drag-and-drop matrix.
Correctness + row XP are validated server-side from lib.content.EB_CORRECT."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_user
from lib.content import EB_CORRECT, EB_FIELD_LABELS, EB_FIELDS, EB_ROW_XP, EB_CARDS
from lib.db import db
from models.game import EvidenceBoardState, EvidenceCardOut, EvidencePutInput, Ok

router = APIRouter()


async def _board(user_id: str) -> dict:
    doc = await db.evidence_boards.find_one({"user_id": user_id})
    return doc or {"placements": {}, "completed_rows": []}


@router.get("/pool", response_model=list[EvidenceCardOut])
async def card_pool(user: dict = Depends(require_user)):
    # scientist is intentionally NOT exposed to the client — matching it is the exercise.
    return [EvidenceCardOut(id=c.id, text=c.text, field=c.field) for c in EB_CARDS]


@router.get("", response_model=EvidenceBoardState)
async def get_board(user: dict = Depends(require_user)):
    doc = await _board(user["id"])
    return EvidenceBoardState(
        placements=doc.get("placements", {}),
        completed_rows=doc.get("completed_rows", []),
        xp_earned=len(doc.get("completed_rows", [])) * EB_ROW_XP,
    )


@router.put("", response_model=EvidenceBoardState)
async def put_card(body: EvidencePutInput, user: dict = Depends(require_user)):
    if body.scientist_id not in EB_CORRECT:
        raise HTTPException(status_code=404, detail="Bilim insanı bulunamadı.")
    if body.field not in EB_FIELDS:
        raise HTTPException(status_code=422, detail="Geçersiz kanıt alanı.")

    doc = await _board(user["id"])
    placements: dict[str, dict[str, str]] = doc.get("placements", {})
    row = placements.get(body.scientist_id, {})

    if body.card_id is None:
        row.pop(body.field, None)
    else:
        card = next((c for c in EB_CARDS if c.id == body.card_id), None)
        if not card:
            raise HTTPException(status_code=404, detail="Kart bulunamadı.")
        # remove the card from any other cell first (a card lives in exactly one cell)
        for s_id, r in placements.items():
            for f, cid in list(r.items()):
                if cid == body.card_id and not (s_id == body.scientist_id and f == body.field):
                    r.pop(f)
        row[body.field] = body.card_id
    placements[body.scientist_id] = row

    newly_correct: list[str] = []
    for s_id, mapping in EB_CORRECT.items():
        if all(placements.get(s_id, {}).get(f) == cid for f, cid in mapping.items()):
            if s_id not in doc.get("completed_rows", []):
                newly_correct.append(s_id)

    completed_rows = sorted(set(doc.get("completed_rows", [])) | set(newly_correct))
    await db.evidence_boards.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "placements": placements,
            "completed_rows": completed_rows,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    if newly_correct:
        from routers.missions import register_task

        for s_id in newly_correct:
            await register_task(user, "evidence-board", f"row-{s_id}", xp_override=EB_ROW_XP)

    return EvidenceBoardState(
        placements=placements,
        completed_rows=completed_rows,
        xp_earned=len(completed_rows) * EB_ROW_XP,
    )
