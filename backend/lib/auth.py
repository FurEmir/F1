"""Session cookie auth + role guards. Sessions are httpOnly cookies; tokens live in Mongo."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from passlib.context import CryptContext

from lib.content import DEFAULT_CLASS, level_for
from lib.db import db

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

COOKIE_NAME = "kd_session"
SESSION_TTL = timedelta(days=7)


def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)


def verify_pin(pin: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(pin, hashed)
    except Exception:
        return False


def new_token() -> str:
    return secrets.token_hex(32)


async def get_current_user(request: Request) -> dict | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    session = await db.sessions.find_one({"token": token})
    if not session:
        return None
    expires = session.get("expires_at")
    if isinstance(expires, datetime) and expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        await db.sessions.delete_one({"token": token})
        return None
    return await db.users.find_one({"id": session["user_id"]})


async def require_user(user: dict | None = Depends(get_current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Oturum bulunamadı. Lütfen giriş yapın.")
    return user


def require_role(*roles: str):
    async def guard(user: dict = Depends(require_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Bu alana erişim yetkiniz yok.")
        return user
    return guard


def public_profile(user: dict) -> dict:
    level, title = level_for(user.get("xp", 0))
    return {
        "id": user["id"],
        "role": user["role"],
        "code": user["code"],
        "nickname": user.get("nickname"),
        "class_id": user.get("class_id", DEFAULT_CLASS),
        "xp": user.get("xp", 0),
        "level": level,
        "level_title": title,
        "badges": user.get("badges", []),
        "onboarded": user.get("onboarded", False),
        "avatar_seed": user.get("avatar_seed", "emerald"),
        "last_active": user.get("last_active").isoformat() if isinstance(user.get("last_active"), datetime) else None,
    }
