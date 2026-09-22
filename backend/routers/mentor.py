"""Dr. Nova — Socratic AI mentor over SSE. PII is scrubbed before storage and before the model call.
Chat history is session-scoped and user-deletable (data minimization)."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from lib.ai import scrub_pii, stream_mentor_reply
from lib.auth import require_user
from lib.db import db
from models.game import MentorChatInput, MentorMessage, Ok

router = APIRouter()

PII_NOTICE = "🔒 Güvenlik notu: Mesajında kişisel veriye benzeyen bilgi tespit edildi ve saklanmadan önce silindi."


def _msg(doc: dict) -> MentorMessage:
    return MentorMessage(
        id=doc["id"],
        role=doc["role"],
        text=doc["text"],
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
    )


@router.post("/chat")
async def chat(body: MentorChatInput, user: dict = Depends(require_user)):
    cleaned, pii_found = scrub_pii(body.message.strip())

    history_docs = await db.mentor_messages.find({"user_id": user["id"]}).sort("created_at", 1).to_list(20)
    history = [{"role": d["role"], "text": d["text"]} for d in history_docs]

    now = datetime.now(timezone.utc)
    student_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "role": "student",
        "text": cleaned,
        "created_at": now,
        "mission_id": body.mission_id,
    }
    await db.mentor_messages.insert_one(student_doc)

    async def event_gen():
        yield f"data: {json.dumps({'type': 'start'}, ensure_ascii=False)}\n\n"
        if pii_found:
            notice = json.dumps({"type": "delta", "text": PII_NOTICE + "\n\n"}, ensure_ascii=False)
            yield f"data: {notice}\n\n"
        chunks: list[str] = []
        try:
            async for delta in stream_mentor_reply(history, cleaned, body.mission_id):
                chunks.append(delta)
                yield f"data: {json.dumps({'type': 'delta', 'text': delta}, ensure_ascii=False)}\n\n"
        except Exception as exc:  # belt and suspenders: never leave the stream hanging
            fallback = "Bir teknik aksaklık oldu ama devam edelim: bu düşünceni hangi gözlem destekliyor?"
            chunks.append(fallback)
            yield f"data: {json.dumps({'type': 'delta', 'text': fallback}, ensure_ascii=False)}\n\n"
        full = "".join(chunks)
        await db.mentor_messages.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "role": "mentor",
            "text": full,
            "created_at": datetime.now(timezone.utc),
            "mission_id": body.mission_id,
        })
        yield f"data: {json.dumps({'type': 'done', 'text': full}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/history", response_model=list[MentorMessage])
async def history(user: dict = Depends(require_user)):
    docs = await db.mentor_messages.find({"user_id": user["id"]}).sort("created_at", 1).to_list(200)
    return [_msg(d) for d in docs]


@router.delete("/history", response_model=Ok)
async def clear_history(user: dict = Depends(require_user)):
    await db.mentor_messages.delete_many({"user_id": user["id"]})
    return Ok(detail="Mentor konuşma geçmişi silindi.")
