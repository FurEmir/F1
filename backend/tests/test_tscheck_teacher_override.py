"""Teacher review criterion: accept AI score, then override with new rubric scores,
and confirm the override persists on re-fetch (student detail)."""

import httpx
import pytest

BACKEND_URL = "http://localhost:8001"
API_URL = f"{BACKEND_URL}/api"


@pytest.fixture
def teacher_client():
    c = httpx.Client(base_url=API_URL, timeout=30.0)
    r = c.post("/auth/login", json={"code": "OG-1001", "pin": "4321"})
    assert r.status_code == 200, r.text
    yield c
    c.close()


def _find_kd2002_submission(teacher_client) -> str:
    students = teacher_client.get("/teacher/students").json()
    kd = next(s for s in students if s["code"] == "KD-2002")
    detail = teacher_client.get(f"/teacher/students/{kd['id']}").json()
    subs = detail.get("submissions") or []
    assert subs, "KD-2002 expected to have a final submission"
    return subs[0]["id"]


def test_teacher_accept_then_override_persists(teacher_client):
    sub_id = _find_kd2002_submission(teacher_client)

    # Accept AI score first
    r_accept = teacher_client.patch(f"/teacher/submissions/{sub_id}", json={"action": "accept"})
    assert r_accept.status_code == 200, r_accept.text
    assert r_accept.json()["extra"]["teacher"]["accepted"] is True

    # Now override with explicit rubric numbers
    r_override = teacher_client.patch(
        f"/teacher/submissions/{sub_id}",
        json={"action": "override", "nature": 2, "conceptual": 2, "synthesis": 3, "feedback": "tscheck override"},
    )
    assert r_override.status_code == 200, r_override.text
    teacher_review = r_override.json()["extra"]["teacher"]
    assert teacher_review["accepted"] is False
    assert teacher_review["total"] == 7

    # Confirm persistence via a fresh fetch
    detail = teacher_client.get(f"/teacher/students/{_kd2002_id(teacher_client)}").json()
    persisted_sub = next(s for s in detail["submissions"] if s["id"] == sub_id)
    assert persisted_sub["teacher"]["accepted"] is False
    assert persisted_sub["teacher"]["total"] == 7
    assert persisted_sub["teacher"]["feedback"] == "tscheck override"


def _kd2002_id(teacher_client) -> str:
    students = teacher_client.get("/teacher/students").json()
    return next(s for s in students if s["code"] == "KD-2002")["id"]
