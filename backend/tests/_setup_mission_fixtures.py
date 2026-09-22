"""One-off fixture setup (not a pytest file) — completes prerequisite mission tasks via the
live API for fixture accounts, so browser checks can open later missions directly without
touching any seeded KD-20xx account. Run manually:
    python tests/_setup_mission_fixtures.py
"""
import httpx

BASE = "http://localhost:8001/api"


def complete(client: httpx.Client, mission_id: str, task_key: str):
    r = client.post(f"/missions/{mission_id}/complete", json={"task_key": task_key, "answers": {"note": "tscheck-fixture"}})
    assert r.status_code == 200, (mission_id, task_key, r.text)


def setup(code: str, missions: list[tuple[str, list[str]]]):
    with httpx.Client(base_url=BASE, timeout=30.0) as c:
        r = c.post("/auth/login", json={"code": code})
        assert r.status_code == 200, r.text
        for mission_id, tasks in missions:
            for tk in tasks:
                complete(c, mission_id, tk)
        states = c.get("/missions").json()
        print(code, {s["id"]: s["status"] for s in states})


if __name__ == "__main__":
    # TSCHECK-03 -> unlocks rutherford-operasyonu
    setup("TSCHECK-03", [
        ("karanlik-kutu", ["gozlem", "ilk-model"]),
        ("dalton-dosyasi", ["dosya-inceleme", "cikarim"]),
        ("thomson-izi", ["npc-diyalog", "zincir"]),
    ])
    # TSCHECK-04 -> unlocks bilimsel-kirilma (final task)
    setup("TSCHECK-04", [
        ("karanlik-kutu", ["gozlem", "ilk-model"]),
        ("dalton-dosyasi", ["dosya-inceleme", "cikarim"]),
        ("thomson-izi", ["npc-diyalog", "zincir"]),
        ("rutherford-operasyonu", ["simulasyon", "kanit-panosu", "cikarim"]),
        ("bohr-sirri", ["npc-diyalog", "aciklama"]),
        ("chadwick-dosyasi", ["siralama", "zincir"]),
    ])
