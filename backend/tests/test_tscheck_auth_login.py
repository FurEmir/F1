"""Login criterion: student passwordless code login, teacher code+PIN login,
wrong code -> 404, wrong PIN -> 401."""


def test_student_login_success(client):
    resp = client.post("/auth/login", json={"code": "KD-2048"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["code"] == "KD-2048"
    assert body["role"] == "student"


def test_teacher_login_success(client):
    resp = client.post("/auth/login", json={"code": "OG-1001", "pin": "4321"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["code"] == "OG-1001"
    assert body["role"] in ("teacher", "admin")


def test_login_unknown_code_404(client):
    resp = client.post("/auth/login", json={"code": "KD-9999-TSCHECK"})
    assert resp.status_code == 404, resp.text
    assert "bulunamadı" in resp.json()["detail"]


def test_teacher_login_wrong_pin_401(client):
    resp = client.post("/auth/login", json={"code": "OG-1001", "pin": "0000"})
    assert resp.status_code == 401, resp.text
    assert "PIN" in resp.json()["detail"]
