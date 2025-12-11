#!/bin/bash

echo "=================================================="
echo "  STRESS SYSTEM – FULL BACKEND AUTOMATION SETUP"
echo "  (Unit Tests + Swagger + Load Tests + Logging)"
echo "=================================================="

ROOT=$(pwd)

###############################################
# 1. INSTALL DEPENDENCIES
###############################################
echo "Installing backend dependencies..."
pip install pytest pytest-cov flasgger k6 locust gunicorn python-json-logger >> /dev/null

mkdir -p backend/tests
mkdir -p backend/loadtest
mkdir -p backend/logs

echo "OK ✓ Dependencies installed"
echo ""

###############################################
# 2. CREATE UNIT TESTS FOR ALL ENDPOINTS
###############################################
echo "Generating pytest suite..."

cat > backend/tests/test_all_endpoints.py << 'EOF'
import pytest
import requests

BASE = "http://localhost:5000"

def test_health():
    r = requests.get(BASE + "/healthz").json()
    assert r["ok"] == True

def test_register():
    r = requests.post(BASE + "/api/register", json={}).json()
    assert r["ok"] == True
    assert "participant_id" in r

def test_session():
    pid = requests.post(BASE + "/api/register", json={}).json()["participant_id"]
    r = requests.post(BASE + "/api/session", json={"participant_id": pid}).json()
    assert r["ok"] == True
    assert "token" in r["data"]

def test_stress_missing_rr():
    r = requests.post(BASE + "/api/stress", json={})
    assert r.status_code == 400

def test_stress_valid():
    pid = requests.post(BASE + "/api/register").json()["participant_id"]
    session = requests.post(BASE + "/api/session", json={"participant_id": pid}).json()["data"]
    token = session["token"]
    r = requests.post(
        BASE + "/api/stress",
        json={"rr_intervals_ms": [800, 780, 790]},
        headers={"Authorization": f"Bearer {token}"}
    ).json()
    assert r["ok"] == True

# TASK ENGINE
def test_task_flow():
    pid = requests.post(BASE + "/api/register").json()["participant_id"]
    session = requests.post(BASE + "/api/session", json={"participant_id": pid}).json()["data"]
    token = session["token"]

    start = requests.post(BASE + "/api/task/start", json={"token": token, "task": "nback"}).json()
    assert start["ok"] == True
    sid = start["session_id"]

    ev = requests.post(BASE + "/api/task/event", json={
        "token": token,
        "session_id": sid,
        "trial_index": 1,
        "correct": True
    }).json()
    assert ev["ok"] == True

    fin = requests.post(BASE + "/api/task/finish", json={
        "token": token,
        "session_id": sid
    }).json()
    assert fin["ok"] == True

EOF

echo "✓ Unit tests generated in backend/tests/test_all_endpoints.py"
echo ""

###############################################
# 3. ADD SWAGGER DOCUMENTATION
###############################################
echo "Adding Swagger docs..."

mkdir -p backend/docs

cat > backend/docs/swagger.yaml << 'EOF'
swagger: "2.0"
info:
  title: Stress Adaptive Cognitive System API
  version: "1.0.0"

paths:
  /healthz:
    get:
      summary: Health check
      responses:
        200:
          description: OK

  /api/register:
    post:
      summary: Register participant
      parameters:
        - name: body
          in: body
          schema:
            type: object
            properties:
              participant_id:
                type: string
      responses:
        200:
          description: Registered

  /api/session:
    post:
      summary: Create session
      parameters:
        - name: body
          in: body
          schema:
            type: object
            properties:
              participant_id:
                type: string
      responses:
        200:
          description: Session created

  /api/stress:
    post:
      summary: Stress inference
      parameters:
        - name: body
          in: body
          schema:
            type: object
            properties:
              rr_intervals_ms:
                type: array
                items: { type: number }
      responses:
        200:
          description: Stress output
EOF


# Modify app.py to mount Swagger UI IF NOT ALREADY MOUNTED
if ! grep -q "from flasgger import Swagger" backend/app.py; then
cat >> backend/app.py << 'EOF'

###############################################
# SWAGGER UI SETUP
###############################################
from flasgger import Swagger
swagger = Swagger(app, template_file="docs/swagger.yaml")

EOF
fi

echo "✓ Swagger added at /docs"
echo ""

###############################################
# 4. LOAD TEST (k6)
###############################################
echo "Creating k6 load tests..."

cat > backend/loadtest/stress_test.js << 'EOF'
import http from 'k6/http';
import { sleep } from 'k6';

export const options = { vus: 20, duration: "20s" };

export default function () {
  http.post("http://localhost:5000/api/stress", JSON.stringify({
    rr_intervals_ms: [750, 780, 790]
  }), { headers: { "Content-Type": "application/json" } });
  sleep(1);
}
EOF

cat > backend/loadtest/task_test.js << 'EOF'
import http from 'k6/http';

export const options = { vus: 10, duration: "20s" };

export default function () {
  const reg = http.post("http://localhost:5000/api/register");
  const pid = JSON.parse(reg.body).participant_id;

  const sess = http.post("http://localhost:5000/api/session", JSON.stringify({ participant_id: pid }), {
    headers: { "Content-Type": "application/json" }
  });

  const token = JSON.parse(sess.body).data.token;

  http.post("http://localhost:5000/api/task/start", JSON.stringify({ token: token, task: "nback" }), {
    headers: { "Content-Type": "application/json" }
  });
}
EOF

echo "✓ Load tests created (k6)"
echo ""

###############################################
# 5. LOGGING (Rotating Logs + Gunicorn Config)
###############################################
echo "Configuring logging..."

mkdir -p backend/logs

cat > backend/logging.conf << 'EOF'
[loggers]
keys=root

[handlers]
keys=rotatingHandler

[formatters]
keys=stdFormatter

[logger_root]
level=INFO
handlers=rotatingHandler

[handler_rotatingHandler]
class=logging.handlers.RotatingFileHandler
level=INFO
formatter=stdFormatter
args=("backend/logs/app.log", "a", 10000000, 5)

[formatter_stdFormatter]
format=%(asctime)s - %(levelname)s - %(message)s
EOF

echo "✓ Logging configured"
echo ""

###############################################
# DONE
###############################################

echo "=================================================="
echo "  ALL PHASES COMPLETED SUCCESSFULLY! 🎉"
echo ""
echo " Run API:        python backend/app.py"
echo " Run tests:      pytest backend/tests -q"
echo " Swagger UI:     http://localhost:5000/docs"
echo " Load test:      k6 run backend/loadtest/stress_test.js"
echo " Logs:           backend/logs/app.log"
echo "=================================================="
