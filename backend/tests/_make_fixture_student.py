"""One-off helper (not a pytest file) to insert fresh fixture student accounts for
browser checks, without touching any seeded KD-20xx rows. Run manually:
    python tests/_make_fixture_student.py CODE
"""
import asyncio
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, ".")
from lib.db import db  # noqa: E402


async def main(code: str, onboarded: bool):
    now = datetime.now(timezone.utc)
    existing = await db.users.find_one({"code": code})
    if existing:
        await db.users.delete_one({"code": code})
        await db.progress.delete_many({"user_id": existing["id"]})
    await db.users.insert_one({
        "id": str(uuid.uuid4()), "role": "student", "code": code, "name": None,
        "nickname": None, "class_id": "9-A", "pin_hash": None,
        "xp": 0, "badges": [], "onboarded": onboarded, "last_active": now,
    })
    print(f"created {code} onboarded={onboarded}")


if __name__ == "__main__":
    onboarded_flag = len(sys.argv) > 2 and sys.argv[2] == "onboarded"
    asyncio.run(main(sys.argv[1], onboarded_flag))
