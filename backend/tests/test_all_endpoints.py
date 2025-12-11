import pytest
import requests

BASE = "http://localhost:5000"

def test_health():
    r = requests.get(BASE + "/healthz").json()
    assert r["ok"] is True


# -----------------------------
# REGISTER
# -----------------------------
def test_register():
    r = requests.post(BASE + "/api/register", json={}).json()
    assert r["ok"] is True
    assert "participant_id" in r


# -----------------------------
# SESSION
# -----------------------------
def test_session():
    pid = requests.post(BASE + "/api/register", json={}).json()["participant_id"]
    r = requests.post(BASE + "/api/session", json={"participant_id": pid}).json()
    assert r["ok"] is True
    assert "token" in r["data"]


# -----------------------------
# STRESS ENDPOINT
# -----------------------------
def test_stress_missing_rr():
    r = requests.post(BASE + "/api/stress", json={})
    assert r.status_code == 400


def test_stress_valid():
    pid = requests.post(BASE + "/api/register", json={}).json()["participant_id"]
    session = requests.post(
        BASE + "/api/session",
        json={"participant_id": pid}
    ).json()["data"]

    token = session["token"]

    r = requests.post(
        BASE + "/api/stress",
        json={"rr_intervals_ms": [800, 780, 790]},
        headers={"Authorization": f"Bearer {token}"}
    ).json()

    assert r["ok"] is True


# -----------------------------
# TASK ENGINE
# -----------------------------
def test_task_flow():
    pid = requests.post(BASE + "/api/register", json={}).json()["participant_id"]

    session = requests.post(
        BASE + "/api/session", json={"participant_id": pid}
    ).json()["data"]

    token = session["token"]

    # Start task
    start = requests.post(
        BASE + "/api/task/start",
        json={"token": token, "task": "nback"}
    ).json()

    assert start["ok"] is True
    sid = start["session_id"]

    # Event
    ev = requests.post(
        BASE + "/api/task/event",
        json={
            "token": token,
            "session_id": sid,
            "trial_index": 1,
            "correct": True
        }
    ).json()

    assert ev["ok"] is True

    # Finish
    fin = requests.post(
        BASE + "/api/task/finish",
        json={"token": token, "session_id": sid}
    ).json()

    assert fin["ok"] is True
