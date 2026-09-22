"""Teacher command center: class overview, student evidence, rubric override, misconception radar, settings.
Every route is guarded to teacher/admin roles at the backend (RBAC), not only in the UI."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_role
from lib.content import BADGES, MISSION_META, MISSION_ORDER
from lib.db import db
from models.game import Ok, SettingsInput, TeacherReviewInput

router = APIRouter()

OUTCOME_LABELS = {
    "baslangic": "Başlangıç",
    "gelisiyor": "Gelişiyor",
    "yeterli": "Yeterli kanıt",
    "ileri": "İleri düzey",
}


def outcome_level(missions_done: int, final_total: int | None) -> str:
    score = missions_done * 12 + (final_total or 0) * 4
    pct = score / 112
    if pct >= 0.85:
        return "ileri"
    if pct >= 0.6:
        return "yeterli"
    if pct >= 0.3:
        return "gelisiyor"
    return "baslangic"


async def _settings() -> dict:
    doc = await db.settings.find_one({"id": "teacher-settings"})
    return doc or {"leaderboard_enabled": True}


async def _class_students(class_id: str | None = None) -> list[dict]:
    query = {"role": "student"}
    if class_id:
        query["class_id"] = class_id
    return await db.users.find(query).sort("code", 1).to_list(500)


@router.get("/overview")
async def overview(user: dict = Depends(require_role("teacher", "admin"))):
    students = await _class_students()
    subs = await db.submissions.find().to_list(1000)
    progress_docs = await db.progress.find().to_list(5000)

    now = datetime.now(timezone.utc)
    per_student_missions: dict[str, set[str]] = {}
    for d in progress_docs:
        per_student_missions.setdefault(d["user_id"], set()).add(d["mission_id"])

    active = 0
    outcome_counts = {"baslangic": 0, "gelisiyor": 0, "yeterli": 0, "ileri": 0}
    mission_completion: dict[str, dict] = {m: {"id": m, "title": MISSION_META[m]["title"], "code": MISSION_META[m]["code"], "completed": 0} for m in MISSION_ORDER}
    final_totals: dict[str, int] = {}
    for s in students:
        last = s.get("last_active")
        if isinstance(last, datetime) and (now - last.replace(tzinfo=timezone.utc)).days <= 7:
            active += 1
        done = {m for m in per_student_missions.get(s["id"], set()) if m in MISSION_ORDER}
        best_final = None
        for sub in subs:
            if sub["user_id"] == s["id"] and sub.get("ai"):
                total = sub["ai"].get("total", 0)
                best_final = max(best_final or 0, total)
                if sub.get("teacher"):
                    total = sub["teacher"].get("total", total)
                    best_final = max(best_final, total)
        final_totals[s["id"]] = best_final
        outcome_counts[outcome_level(len(done), best_final)] += 1
        for m in done:
            mission_completion[m]["completed"] += 1

    teacher_reviewed = sum(1 for sub in subs if sub.get("teacher"))
    total_students = len(students)
    return {
        "total_students": total_students,
        "active_students": active,
        "mission_completion_rate": round(
            100 * sum(1 for m in MISSION_ORDER[:6] for s in students if m in per_student_missions.get(s["id"], set())) / max(1, total_students * 6)
        ),
        "ai_assessment_count": len(subs),
        "teacher_reviewed_count": teacher_reviewed,
        "outcome_distribution": [
            {"key": k, "label": OUTCOME_LABELS[k], "count": v} for k, v in outcome_counts.items()
        ],
        "mission_completion": [mission_completion[m] for m in MISSION_ORDER],
        "leaderboard_enabled": (await _settings()).get("leaderboard_enabled", True),
        "kim_code": "KİM.9.1.3",
        "kim_text": "Atom teorilerindeki varsayımları kullanarak bilimsel bilginin değişebilirliğine ilişkin çıkarım yapabilme.",
    }


@router.get("/students")
async def students(user: dict = Depends(require_role("teacher", "admin"))):
    students = await _class_students()
    progress_docs = await db.progress.find().to_list(5000)
    per_student: dict[str, set[str]] = {}
    for d in progress_docs:
        per_student.setdefault(d["user_id"], set()).add(d["mission_id"])
    out = []
    now = datetime.now(timezone.utc)
    for s in students:
        done = {m for m in per_student.get(s["id"], set()) if m in MISSION_ORDER}
        req_done = len(done & set(MISSION_ORDER[:6]))
        out.append({
            "id": s["id"],
            "code": s["code"],
            "nickname": s.get("nickname"),
            "xp": s.get("xp", 0),
            "level": s.get("level", 1),
            "missions_completed": req_done,
            "badges": len(s.get("badges", [])),
            "outcome": outcome_level(req_done, None),
            "last_active": s.get("last_active").isoformat() if isinstance(s.get("last_active"), datetime) else None,
        })
    return out


@router.get("/students/{student_id}")
async def student_detail(student_id: str, user: dict = Depends(require_role("teacher", "admin"))):
    s = await db.users.find_one({"id": student_id, "role": "student"})
    if not s:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı.")
    subs = await db.submissions.find({"user_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    progress_docs = await db.progress.find({"user_id": student_id}, {"_id": 0}).to_list(500)
    done = {d["mission_id"] for d in progress_docs if d["mission_id"] in MISSION_ORDER}
    open_answers = [
        {"mission_id": d["mission_id"], "task_key": d["task_key"], "answers": d.get("answers", {}), "created_at": d.get("created_at")}
        for d in progress_docs if d.get("answers")
    ]
    return {
        "id": s["id"],
        "code": s["code"],
        "nickname": s.get("nickname"),
        "xp": s.get("xp", 0),
        "level": s.get("level", 1),
        "badges": [BADGES[b].name for b in s.get("badges", []) if b in BADGES],
        "missions_completed": sorted(done),
        "outcome": outcome_level(len(done & set(MISSION_ORDER[:6])), None),
        "submissions": subs,
        "open_answers": open_answers[:20],
    }


@router.patch("/submissions/{submission_id}")
async def review_submission(submission_id: str, body: TeacherReviewInput, user: dict = Depends(require_role("teacher", "admin"))):
    sub = await db.submissions.find_one({"id": submission_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Ödev bulunamadı.")
    if body.action == "accept":
        ai = sub.get("ai") or {}
        review = {
            "accepted": True,
            "nature": ai.get("nature", 0),
            "conceptual": ai.get("conceptual", 0),
            "synthesis": ai.get("synthesis", 0),
            "total": ai.get("total", 0),
            "feedback": body.feedback,
            "reviewed_at": datetime.now(timezone.utc),
        }
    elif body.action == "override":
        if body.nature is None or body.conceptual is None or body.synthesis is None:
            raise HTTPException(status_code=422, detail="Geçersiz rubrik puanları.")
        review = {
            "accepted": False,
            "nature": body.nature,
            "conceptual": body.conceptual,
            "synthesis": body.synthesis,
            "total": body.nature + body.conceptual + body.synthesis,
            "feedback": body.feedback,
            "reviewed_at": datetime.now(timezone.utc),
        }
    else:
        raise HTTPException(status_code=422, detail="action 'accept' veya 'override' olmalı.")
    await db.submissions.update_one(
        {"id": submission_id},
        {"$set": {"teacher": review, "status": "teacher_reviewed"}},
    )
    return Ok(detail="Değerlendirme kaydedildi.", extra={"teacher": review})


@router.get("/misconceptions")
async def misconceptions(user: dict = Depends(require_role("teacher", "admin"))):
    """Aggregated, non-diagnostic indicators — 'olası kavram yanılgısı göstergesi' only."""
    from lib.ai import MISCONCEPTION_MARKERS, detect_misconceptions

    subs = await db.submissions.find().to_list(1000)
    answers = await db.mission_answers.find().to_list(5000)
    students = await _class_students()
    total = max(1, len(students))

    per_pattern: dict[str, dict] = {
        key: {"key": key, "label": label, "students": set(), "samples": []}
        for key, label in [
            ("gunes-sistemi", "Yörünge/orbital kavramlarını karıştırma"),
            ("kesin-yorunge", "Elektronun kesin yörüngede döndüğünü sanma"),
            ("yanlis-uydurma", "Eski bilim insanlarını 'uydurmacıkla' suçlama"),
            ("dalton-degersiz", "Modelleri 'yanlış/değersiz' olarak ikileme"),
            ("degismez-bilgi", "Bilimsel bilgiyi değişmez görme"),
            ("eski-model-cop", "Yeni modelle eski modelin tamamen çöktüğünü sanma"),
        ]
    }

    def register(uid: str, code: str, text: str, source: str):
        for key in detect_misconceptions(text):
            entry = per_pattern[key]
            entry["students"].add(uid)
            if len(entry["samples"]) < 3:
                excerpt = text[:140]
                entry["samples"].append({"code": code, "excerpt": excerpt, "source": source})

    for sub in subs:
        for m in (sub.get("ai") or {}).get("misconceptions", []):
            low = m.lower()
            for key in per_pattern:
                marker_words = {
                    "gunes-sistemi": ["güneş sistem", "gunes sistem"],
                    "kesin-yorunge": ["yörünge", "yorunge", "dairesel"],
                    "yanlis-uydurma": ["uydur"],
                    "dalton-degersiz": ["değersiz", "degersiz"],
                    "degismez-bilgi": ["değişmez", "degismez", "kesin ve değişmez"],
                    "eski-model-cop": ["işe yaramaz", "ise yaramaz", "çöktü", "kop"],
                }[key]
                if any(w in low for w in marker_words):
                    register(sub["user_id"], sub.get("code", "?"), m, "AI ön değerlendirmesi")
                    break
        register(sub["user_id"], sub.get("code", "?"), sub.get("text", ""), "Açık uçlu cevap")

    for a in answers:
        for _k, v in (a.get("answers") or {}).items():
            if isinstance(v, str) and len(v) > 25:
                register(a["user_id"], "?", v, f"{a.get('mission_id')} / {a.get('task_key')}")

    indicators = []
    for entry in per_pattern.values():
        count = len(entry["students"])
        indicators.append({
            "key": entry["key"],
            "label": entry["label"],
            "count": count,
            "percent": round(100 * count / total),
            "samples": entry["samples"],
        })
    indicators.sort(key=lambda x: -x["percent"])
    return {
        "class_size": len(students),
        "indicators": indicators,
        "note": "Bu göstergeler kesin teşhis değildir; öğretmen incelemesine sunulan öğrenme kanıtıdır.",
    }


@router.get("/settings")
async def get_settings(user: dict = Depends(require_role("teacher", "admin"))):
    s = await _settings()
    return {"leaderboard_enabled": s.get("leaderboard_enabled", True)}


@router.patch("/settings")
async def patch_settings(body: SettingsInput, user: dict = Depends(require_role("teacher", "admin"))):
    await db.settings.update_one(
        {"id": "teacher-settings"},
        {"$set": {"leaderboard_enabled": body.leaderboard_enabled}},
        upsert=True,
    )
    return Ok(detail="Ayarlar kaydedildi.", extra={"leaderboard_enabled": body.leaderboard_enabled})
