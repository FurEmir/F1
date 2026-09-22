"""Auth: students log in with a school-issued detective code (passwordless); teacher/admin with code + PIN.
Sessions are httpOnly cookies — tokens never appear in JSON responses."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.auth import COOKIE_NAME, SESSION_TTL, new_token, public_profile, require_user, verify_pin
from lib.db import db
from models.game import LoginInput, NicknameInput, Ok, UserProfile

router = APIRouter()


@router.post("/login", response_model=UserProfile)
async def login(body: LoginInput, response: Response):
    code = body.code.strip().upper()
    user = await db.users.find_one({"code": code})
    if not user:
        raise HTTPException(status_code=404, detail="Bu dedektif kodu bulunamadı. Kodu okulunuz verir.")
    if user["role"] in ("teacher", "admin"):
        if not body.pin or not verify_pin(body.pin, user.get("pin_hash", "")):
            raise HTTPException(status_code=401, detail="PIN hatalı.")
    token = new_token()
    now = datetime.now(timezone.utc)
    await db.sessions.insert_one({
        "token": token,
        "user_id": user["id"],
        "created_at": now,
        "expires_at": now + SESSION_TTL,
    })
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_active": now}})
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, samesite="lax", max_age=int(SESSION_TTL.total_seconds())
    )
    profile = public_profile(user)
    profile["last_active"] = now
    return profile


@router.post("/logout", response_model=Ok)
async def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await db.sessions.delete_one({"token": token})
    response.delete_cookie(COOKIE_NAME)
    return Ok(detail="Oturum kapatıldı.")


@router.get("/me", response_model=UserProfile)
async def me(user: dict = Depends(require_user)):
    return public_profile(user)


@router.patch("/me/onboarded", response_model=UserProfile)
async def set_onboarded(user: dict = Depends(require_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"onboarded": True}})
    user["onboarded"] = True
    return public_profile(user)


@router.patch("/me/nickname", response_model=UserProfile)
async def set_nickname(body: NicknameInput, user: dict = Depends(require_user)):
    nickname = body.nickname.strip()
    if not nickname:
        raise HTTPException(status_code=422, detail="Takma ad boş olamaz.")
    await db.users.update_one({"id": user["id"]}, {"$set": {"nickname": nickname}})
    user["nickname"] = nickname
    return public_profile(user)
