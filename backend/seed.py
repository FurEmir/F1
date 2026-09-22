"""Seed synthetic demo data — 30 pseudonymous students (no real personal data), 1 teacher, 1 admin.
Run: cd /app/backend && python seed.py"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from lib.auth import hash_pin
from lib.content import EB_CORRECT, MISSION_TASKS, MISSION_ORDER, level_for
from lib.db import client, db, ensure_indexes

random.seed(7)

NOW = datetime.now(timezone.utc)
FINAL_PROMPT = "Rutherford'un Altın Levha Deneyi hiç yapılmasaydı atom teorilerinin gelişimi nasıl etkilenebilirdi?"

NICKNAMES = [
    "QuantumFox", "NeonFoton", "MorAntojan", "SogukPlazma", "GizliIzotop", "HizliNötron",
    "MaviSpektrum", "KaranlıkMadde", "AltınSaçılım", "CosmicRay42", "DeltaPiksel", "EnerjiKuşağı",
    "FotonKedi", "GamaIşını", "HidrojenRüyası", "IsıMakinesi", "JenerikYörünge", "KristalKafes",
    "LazerPenguen", "MutlakSıfır", "NobelAdayı", "OrbitalBulut", "ProtonBalığı", "RadikalYarıçap",
    "SarmalDNA", "TitreşimModu", "UranüsNotu", "VoltAmper", "YarıÖmür", "ZamanKapsülü",
]

# (essay text, nature, conceptual, synthesis) — synthetic student answers for the final task
ESSAYS = [
    ("Rutherford deneyi hiç yapılmasaydı çekirdeğin varlığını bilmeyecektik. Atomun içinde pozitif yükün küçük bir yerde toplandığı yeni kanıtlarla öğrenildi. Bu yüzden bilimsel bilgi yeni kanıtlarla değişir ve gelişir. Thomson modelinden Rutherford modeline geçiş böyle oldu. Bohr da enerji düzeylerini ekledi. Yani modeller kanıtlar doğrultusunda kuruluyor ve gelişiyor.", 3, 3, 4),
    ("Deney yapılmazsa bilim insanları atomun çoğunun boşluk olduğunu anlayamazdı. Model değişirdi ama belki daha geç değişirdi. Yeni kanıt gelmeden bilim ilerlemiyor gibi düşünüyorum.", 2, 2, 3),
    ("Atom güneş sistemi gibidir zaten. Rutherford olmasa da aynı şeyi başkaları bulurdu, modeller hep yanlıştı, eski model tamamen işe yaramaz hale gelir.", 1, 1, 1),
    ("Eğer deney hiç yapılmasaydı Thomson modeli daha uzun süre kabul görürdü. Çünkü bilimsel modeller mevcut kanıtlara göre rasyoneldir; yeni kanıt (büyük açılı saçılma) gelince model değişti. Deney olmasa çekirdek fikri gecikebilir, belki başka deneylerle sonra bulunurdu. Dalton'un modeli de kendi dönemi için kanıtlara dayanıyordu, o yüzden değersiz değildi; kanıtlar geliştikçe modeller gelişiyor.", 3, 3, 4),
    ("Hiç yapılmasaydı atom hala bölünemez küre sanılırdı. Bilim değişmez zaten kesin bilgiler var. Rutherford çekirdeği buldu.", 0, 1, 1),
    ("Deney olmasaydı, büyük açılı saçılma gözlemi olmayacağı için çekirdek varsayımı ortaya çıkmazdı. Bilimsel bilgi kanıtlarla desteklendiği için yeni kanıtlar beklenecekti. Belki katot ışınları gibi başka deneylerle sonra keşfedilirdi. Model değişimi kanıta bağlıdır.", 3, 2, 3),
    ("Rutherford deneyi olmasaydı Bohr modeli de olmazdı çünkü çekirdek bilinmezdi. Elektronlar enerji düzeylerinde dönüyordu zaten. Atom her şeyde bölünemez.", 1, 1, 2),
    ("Bence deney yapılmamış olsaydı, alfa parçacıklarının geri dönmesi gözlemlenemezdi ve atomun çoğunlukla boş olduğu fikri gecikirdi. Bu da bilimsel bilginin gözleme dayandığını gösteriyor: kanıt gelince model değişti. Tarih zinciri Dalton-Thomson-Rutherford-Bohr olarak ilerledi; eksik bir halka sonrakileri etkilerdi.", 3, 2, 4),
    ("Modeller zaten yanlış uydurulmuştu, deney olmasa da fark etmezdi, bugün aynı şeyleri bilirdik.", 0, 0, 0),
    ("Deney yapılmasaydı bilim insanları net dairesel yörünge fikrini tartışmaya devam ederdi. Ama bilimsel modeller yeni kanıtlarla gelişebildiği için ileride başka deneylerle aynı sonuca varılırdı. Önemli olan kanıt-model ilişkisini kurabilmek.", 2, 2, 3),
]

TEACHER_FEEDBACKS = [
    "Güçlü bir sentez; kanıt-model ilişkisini tarihsel zincirle bağlaman çok iyi.",
    "Kavramsal kısmı daha dikkatli oku; çekirdek ile orbital kavramlarını ayır.",
    "Değişebilirlik argümanın net; bir sonraki adımda karşı örnek ekle.",
]


async def seed() -> None:
    for coll in ["users", "sessions", "progress", "mission_answers", "evidence_boards",
                 "jigsaw_notes", "submissions", "mentor_messages", "settings", "status_checks"]:
        await db[coll].drop()
    await ensure_indexes()

    # ---- staff
    await db.users.insert_one({
        "id": str(uuid.uuid4()), "role": "teacher", "code": "OG-1001", "name": "Ayla Kaya",
        "nickname": None, "class_id": "9-A", "pin_hash": hash_pin("4321"),
        "xp": 0, "badges": [], "onboarded": True, "last_active": NOW,
    })
    await db.users.insert_one({
        "id": str(uuid.uuid4()), "role": "admin", "code": "ADM-0001", "name": "Sistem Yöneticisi",
        "nickname": None, "class_id": None, "pin_hash": hash_pin("0000"),
        "xp": 0, "badges": [], "onboarded": True, "last_active": NOW,
    })

    # ---- students: KD-2001..KD-2029 + fresh demo student KD-2048
    codes = [f"KD-{2001 + i}" for i in range(29)] + ["KD-2048"]
    essay_idx = 0
    for idx, code in enumerate(codes):
        nickname = NICKNAMES[idx]
        is_fresh = code == "KD-2048"
        user_id = str(uuid.uuid4())
        n_missions = 0 if is_fresh else random.choice([0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6])
        has_jigsaw = (not is_fresh) and n_missions >= 4 and random.random() < 0.6
        has_submission = (not is_fresh) and n_missions >= 2 and essay_idx < len(ESSAYS) and random.random() < 0.55

        xp = 0
        progress_docs = []
        for mid in MISSION_ORDER[:6][:n_missions]:
            for task_key, task_xp in MISSION_TASKS[mid]:
                progress_docs.append({
                    "id": str(uuid.uuid4()), "user_id": user_id, "mission_id": mid,
                    "task_key": task_key, "xp": task_xp,
                    "answers": ({"secim": "kanit-2", "metin": "Alfa parçacıklarının çoğu düz geçti, az sayıda geri döndü."}
                                if task_key in ("cikarim", "zincir", "aciklama") else {}),
                    "created_at": NOW - timedelta(hours=random.randint(4, 500)),
                })
                xp += task_xp

        # evidence board rows (correct) for some students
        n_rows = 0 if is_fresh else random.randint(0, 5) if n_missions >= 3 else 0
        placements = {}
        for s_id in list(EB_CORRECT.keys())[:n_rows]:
            placements[s_id] = dict(EB_CORRECT[s_id])
            progress_docs.append({
                "id": str(uuid.uuid4()), "user_id": user_id, "mission_id": "evidence-board",
                "task_key": f"row-{s_id}", "xp": 30, "answers": {}, "created_at": NOW - timedelta(hours=random.randint(2, 300)),
            })
            xp += 30
        if placements:
            await db.evidence_boards.insert_one({
                "user_id": user_id, "placements": placements,
                "completed_rows": sorted(placements.keys()), "updated_at": NOW,
            })

        # jigsaw
        if has_jigsaw:
            expert = random.choice(["dalton", "thomson", "rutherford", "bohr"])
            await db.jigsaw_notes.insert_one({
                "user_id": user_id, "expert_role": expert,
                "notes": {
                    "varsayim": "Uzman grubumuzun modelinin temel varsayımlarını özetledik.",
                    "kanit": "Dönemin deney gözlemlerini dosyadan çıkardık.",
                    "acikliyor": "Modelin açıkladığı gözlemleri listeledik.",
                    "zorlanıyor": "Açıklamakta zorlandığı durumu tartıştık.",
                },
                "synthesis": "Atom teorileri yeni kanıtlarla değişti; her model kendi döneminin kanıtlarına dayanıyordu.",
                "completed": True, "updated_at": NOW,
            })
            for tk, txp in MISSION_TASKS["jigsaw"]:
                progress_docs.append({
                    "id": str(uuid.uuid4()), "user_id": user_id, "mission_id": "jigsaw",
                    "task_key": tk, "xp": txp, "answers": {}, "created_at": NOW - timedelta(hours=random.randint(2, 200)),
                })
                xp += txp

        # final submission with AI(+) pre-assessment
        if has_submission:
            text, nature, conceptual, synthesis = ESSAYS[essay_idx]
            essay_idx += 1
            total = nature + conceptual + synthesis
            teacher = None
            if essay_idx <= len(TEACHER_FEEDBACKS):
                teacher = {
                    "accepted": True, "nature": nature, "conceptual": conceptual, "synthesis": synthesis,
                    "total": total, "feedback": TEACHER_FEEDBACKS[essay_idx - 1], "reviewed_at": NOW,
                }
            await db.submissions.insert_one({
                "id": str(uuid.uuid4()), "user_id": user_id, "code": code, "nickname": nickname,
                "class_id": "9-A", "mission_id": "bilimsel-kirilma", "prompt": FINAL_PROMPT,
                "text": text,
                "ai": {
                    "nature": nature, "conceptual": conceptual, "synthesis": synthesis, "total": total,
                    "rationale": "Ön değerlendirme: sentezin kanıt-model ilişkisiyle kuruluşuna göre puanlandı.",
                    "evidence_used": ["Altın levha gözlemleri"], "misconceptions": [], "suggestions": [],
                },
                "teacher": teacher, "status": "teacher_reviewed" if teacher else "ai_scored",
                "created_at": NOW - timedelta(hours=random.randint(2, 240)),
            })
            progress_docs.append({
                "id": str(uuid.uuid4()), "user_id": user_id, "mission_id": "bilimsel-kirilma",
                "task_key": "gonderim", "xp": 350, "answers": {}, "created_at": NOW,
            })
            xp += 350

        badges: list[str] = []
        if n_missions >= 2:
            badges.append("kanit-avcisi")
        if n_missions >= 5:
            badges += ["model-sorgulayici", "bilim-dedektifi"]
        if has_jigsaw:
            badges.append("bilim-ekibi")

        await db.progress.insert_many(progress_docs) if progress_docs else None
        await db.users.insert_one({
            "id": user_id, "role": "student", "code": code, "nickname": nickname,
            "class_id": "9-A", "xp": xp, "badges": list(set(badges)),
            "onboarded": not is_fresh, "avatar_seed": random.choice(["emerald", "amber", "cyan"]),
            "last_active": NOW - timedelta(hours=0 if is_fresh else random.randint(1, 120)),
        })

    await db.settings.insert_one({"id": "teacher-settings", "leaderboard_enabled": True})

    counts = {
        "users": await db.users.count_documents({}),
        "students": await db.users.count_documents({"role": "student"}),
        "progress": await db.progress.count_documents({}),
        "submissions": await db.submissions.count_documents({}),
        "jigsaw": await db.jigsaw_notes.count_documents({}),
        "boards": await db.evidence_boards.count_documents({}),
    }
    print("seed ok:", counts)


asyncio.run(seed())
client.close()
