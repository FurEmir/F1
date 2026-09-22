"""Final essay ("Bilimsel Kırılma") with AI analytic-rubric pre-assessment.
The AI score is a SUGGESTION — the teacher always has the final word."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.ai import score_submission, scrub_pii
from lib.auth import require_user
from lib.content import BADGES, FINAL_BADGE_THRESHOLD
from lib.db import db
from models.game import Submission, SubmissionInput
from routers.missions import register_task

router = APIRouter()

FINAL_PROMPT = (
    "Rutherford'un Altın Levha Deneyi hiç yapılmasaydı atom teorilerinin gelişimi nasıl etkilenebilirdi?"
)


def _to_submission(doc: dict) -> Submission:
    return Submission(
        id=doc["id"],
        user_id=doc["user_id"],
        code=doc.get("code", ""),
        nickname=doc.get("nickname"),
        class_id=doc.get("class_id", ""),
        mission_id=doc.get("mission_id", "bilimsel-kirilma"),
        prompt=doc.get("prompt", FINAL_PROMPT),
        text=doc.get("text", ""),
        ai=doc.get("ai"),
        teacher=doc.get("teacher"),
        status=doc.get("status", "ai_scored"),
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
    )


@router.post("/score", response_model=Submission)
async def score(body: SubmissionInput, user: dict = Depends(require_user)):
    cleaned, pii_found = scrub_pii(body.text.strip())

    assessment = await score_submission(cleaned)
    total = assessment["nature"] + assessment["conceptual"] + assessment["synthesis"]
    ai = {**assessment, "total": total}

    now = datetime.now(timezone.utc)
    sub_id = str(uuid.uuid4())
    doc = {
        "id": sub_id,
        "user_id": user["id"],
        "code": user["code"],
        "nickname": user.get("nickname"),
        "class_id": user.get("class_id"),
        "mission_id": "bilimsel-kirilma",
        "prompt": FINAL_PROMPT,
        "text": cleaned,
        "ai": ai,
        "teacher": None,
        "status": "ai_scored",
        "created_at": now,
    }
    await db.submissions.insert_one(doc)

    # The final task's XP + completion ride on the first submission.
    await register_task(user, "bilimsel-kirilma", "gonderim", answers={"submission_id": sub_id})

    if total >= FINAL_BADGE_THRESHOLD and "bilimsel-dusunur" not in user.get("badges", []):
        await db.users.update_one({"id": user["id"]}, {"$addToSet": {"badges": "bilimsel-dusunur"}})

    return _to_submission(doc)


@router.get("/my-submissions", response_model=list[Submission])
async def my_submissions(user: dict = Depends(require_user)):
    docs = await db.submissions.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    return [_to_submission(d) for d in docs]
