import requests
import json

BASE = "http://localhost:5000"

def pretty(x):
    print(json.dumps(x, indent=2))

print("---- TEST HEALTH ----")
r = requests.get(BASE + "/healthz").json()
pretty(r)

print("\n---- TEST REGISTER ----")
r = requests.post(BASE + "/api/register", json={}).json()
pretty(r)
pid = r["participant_id"]

print("\n---- TEST SESSION ----")
resp = requests.post(BASE + "/api/session", json={"participant_id": pid})
print("\nRAW SESSION RESPONSE:")
print(resp.status_code)
print(resp.text)   # <--- print raw HTML or error
r = resp.json()
pretty(r)
token = r["data"]["token"]

headers = {"Authorization": f"Bearer {token}"}

print("\n---- TEST STRESS ----")
r = requests.post(BASE + "/api/stress",
    json={"rr_intervals_ms": [800, 810, 790, 805]},
    headers=headers
).json()
pretty(r)

print("\n---- TEST TASK START ----")
r = requests.post(BASE + "/api/task/start",
    json={"task": "nback", "config": {},"token": token}
).json()
pretty(r)
session_id = r["session_id"]

print("\n---- TEST TASK EVENT ----")
r = requests.post(BASE + "/api/task/event",
    json={
        "token": token,
        "session_id": session_id,
        "trial_index": 1,
        "stimulus": "A",
        "response": "match",
        "correct": True,
        "reaction_time_ms": 550,
    }
).json()
pretty(r)

print("\n---- TEST TASK FINISH ----")
r = requests.post(BASE + "/api/task/finish",
    json={"token": token, "session_id": session_id}
).json()
pretty(r)

print("\n---- TEST ADMIN EXTRA ----")

# login
adm = requests.post(BASE+"/api/admin/login",
    json={"username":"admin", "password":"admin123"}
).json()
pretty(adm)

adm_token = adm.get("token")
if adm_token:
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    print("\n-- GET PARTICIPANTS --")
    pretty(requests.get(BASE+"/api/admin/extra/participants", headers=adm_headers).json())

    print("\n-- GET SESSIONS --")
    pretty(requests.get(BASE+"/api/admin/extra/sessions", headers=adm_headers).json())
