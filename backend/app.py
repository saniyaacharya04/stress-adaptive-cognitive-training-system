
# backend/app.py

import os
import uuid
import time
import logging
from datetime import datetime, timedelta
from functools import wraps

import numpy as np
import joblib
import jwt

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import check_password_hash

# Database
from backend.database.base import engine, SessionLocal, Base
from backend.database import models as db

# Swagger
from flasgger import Swagger

###############################################################
# CONFIG
###############################################################

BASE_DIR = os.path.dirname(__file__)
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "app.log")

JWT_SECRET = os.environ.get("JWT_SECRET", "change_this_secret")
JWT_EXP_MINUTES = 720
EMA_ALPHA = 0.3

# Create DB tables
Base.metadata.create_all(bind=engine)

# Optional ML model
MODEL_RF_PATH = os.path.join(BASE_DIR, "models", "stress_rf_model.pkl")
clf_rf = joblib.load(MODEL_RF_PATH) if os.path.exists(MODEL_RF_PATH) else None

###############################################################
# LOGGING
###############################################################

logger = logging.getLogger("backend")
logger.setLevel(logging.INFO)
fh = logging.FileHandler(LOG_FILE)
fh.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
logger.addHandler(fh)

###############################################################
# HELPERS
###############################################################

def gen_token():
  return uuid.uuid4().hex

def create_admin_jwt(username: str):
  payload = {
    "sub": username,
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)
  }
  return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_jwt(token: str):
  return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def require_admin(f):
  @wraps(f)
  def wrapper(*args, **kwargs):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
      return jsonify({"ok": False, "error": "missing token"}), 401

    token = auth.split(" ", 1)[1]
    try:
      payload = decode_jwt(token)
    except Exception:
      return jsonify({"ok": False, "error": "invalid or expired token"}), 401

    if payload.get("role") != "admin":
      return jsonify({"ok": False, "error": "admin required"}), 403

    request.admin_user = payload["sub"]
    return f(*args, **kwargs)
  return wrapper


###############################################################
# HRV FEATURE EXTRACTION
###############################################################

def rr_features(rr):
  rr = np.array(rr, dtype=float)
  if len(rr) < 2:
    return {"rmssd": None, "sdnn": None, "mean_rr": None, "mean_hr": None}

  diff = np.diff(rr)
  rmssd = float(np.sqrt(np.mean(diff**2)))
  sdnn = float(np.std(rr))
  mean_rr = float(np.mean(rr))
  mean_hr = float(60000.0 / mean_rr) if mean_rr > 0 else None

  return {"rmssd": rmssd, "sdnn": sdnn, "mean_rr": mean_rr, "mean_hr": mean_hr}

def infer_stress(rr):
  feat = rr_features(rr)
  out = {"features": feat, "label": 0, "proba": [1, 0, 0]}

  if clf_rf:
    X = [[feat["rmssd"] or 0, feat["sdnn"] or 0, feat["mean_rr"] or 0, feat["mean_hr"] or 0]]
    proba = clf_rf.predict_proba(X)[0].tolist()
    out["proba"] = proba
    out["label"] = int(np.argmax(proba))

  return out


###############################################################
# FLASK INIT
###############################################################

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/")
CORS(app, resources={r"/api/*": {"origins": "*"}})
swagger = Swagger(app)


###############################################################
# HEALTH
###############################################################

@app.route("/healthz")
def health():
  return jsonify({"ok": True})


###############################################################
# ADMIN LOGIN
###############################################################

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
  data = request.get_json() or {}
  username = data.get("username")
  password = data.get("password")

  dbs = SessionLocal()
  try:
    user = dbs.query(db.AdminUser).filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
      return jsonify({"ok": False, "error": "invalid credentials"}), 401

    return jsonify({"ok": True, "token": create_admin_jwt(username)})
  finally:
    dbs.close()


###############################################################
# PARTICIPANT REGISTRATION
###############################################################

@app.route("/api/register", methods=["POST"])
def register():
  data = request.get_json() or {}
  pid = data.get("participant_id") or f"P_{uuid.uuid4().hex[:8]}"

  dbs = SessionLocal()
  try:
    p = dbs.query(db.Participant).filter_by(participant_id=pid).first()
    if not p:
      p = db.Participant(participant_id=pid, assignment_group="control")
      dbs.add(p)
      dbs.commit()

    return jsonify({"ok": True, "participant_id": p.participant_id, "group": p.assignment_group})
  finally:
    dbs.close()


###############################################################
# SESSION CREATION
###############################################################

@app.route("/api/session", methods=["POST"])
def new_session():
  data = request.get_json() or {}
  pid = data.get("participant_id")

  if not pid:
    return jsonify({"ok": False, "error": "participant_id required"}), 400

  dbs = SessionLocal()
  try:
    sess = db.Session(
      participant_id=pid,
      token=gen_token(),
      expires_at=datetime.utcnow() + timedelta(hours=12),
      ema_high=0.0
    )
    dbs.add(sess)
    dbs.commit()
    return jsonify({"ok": True, "data": {"token": sess.token}})
  finally:
    dbs.close()


###############################################################

from backend.routes.admin_extra import bp as admin_bp
from backend.routes.auth import bp as auth_bp
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)

###############################################################
# APPLICATION ENTRYPOINT
###############################################################

def run():
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )

if __name__ in ("__main__", "backend.app"):
    run()
