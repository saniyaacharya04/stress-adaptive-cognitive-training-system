# backend/app.py

import eventlet
eventlet.monkey_patch()

import os
import uuid
import time
import logging
from datetime import datetime, timedelta
from functools import wraps

import numpy as np
import joblib
import jwt

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import check_password_hash

# Database
from database.base import engine, SessionLocal, Base
from database import models as dbmodels

# Swagger
from flasgger import Swagger

###############################################################
# CONFIGURATION
###############################################################

BASE_DIR = os.path.dirname(__file__)
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "app.log")

JWT_SECRET = os.environ.get("JWT_SECRET", "change_this_secret")
JWT_EXP_MINUTES = int(os.environ.get("JWT_EXP_MINUTES", "720"))
EMA_ALPHA = float(os.environ.get("EMA_ALPHA", "0.3"))

Base.metadata.create_all(bind=engine)

# ML model (optional)
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
# PID CONTROLLER
###############################################################

class PIDController:
    def __init__(self, Kp=0.8, Ki=0.06, Kd=0.2, target=0.35):
        self.Kp = Kp
        self.Ki = Ki
        self.Kd = Kd
        self.target = target
        self.integral = 0.0
        self.prev_error = 0.0
        self.last_time = None

    def step(self, measured):
        now = time.time()
        if self.last_time is None:
            self.last_time = now
            return 0.0
        dt = max(1e-3, now - self.last_time)
        self.last_time = now
        error = self.target - measured
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt
        self.prev_error = error
        return self.Kp*error + self.Ki*self.integral + self.Kd*derivative

pid_controllers = {}
difficulty_state = {}

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
# CENTRAL LOGGING (StressLog + TaskLog)
###############################################################

def append_log_db(db, pid, obj):
    tl = dbmodels.TaskLog(
        participant_id=pid,
        session_token=obj.get("session_token"),
        task_name=obj.get("task"),
        trial_index=obj.get("trial"),
        event=obj.get("event"),
        correct=obj.get("correct"),
        reaction_time_ms=obj.get("reaction_time_ms"),
        extra=obj.get("extra"),
    )
    db.add(tl)
    db.commit()

    smoothed = obj.get("smoothed")
    if smoothed:
        sl = dbmodels.StressLog(
            participant_id=pid,
            session_token=obj.get("session_token"),
            raw_proba=obj.get("prediction", {}).get("proba"),
            ema_high=smoothed.get("ema_high"),
            smoothed_label=smoothed.get("smoothed_label"),
            difficulty=obj.get("difficulty"),
            features=obj.get("features")
        )
        db.add(sl)
        db.commit()

###############################################################
# FLASK + SOCKET.IO INIT
###############################################################

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/")

# Enable CORS for front-end dev (adjust origins in production)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")
swagger = Swagger(app)

###############################################################
# BASIC HEALTH
###############################################################

@app.route("/healthz")
def healthz():
    return jsonify({"ok": True})

###############################################################
# ADMIN LOGIN
###############################################################

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    db = SessionLocal()
    try:
        user = db.query(dbmodels.AdminUser).filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"ok": False, "error": "invalid credentials"}), 401
        return jsonify({"ok": True, "token": create_admin_jwt(username)})
    finally:
        db.close()

###############################################################
# PARTICIPANT REGISTER
###############################################################

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    pid = data.get("participant_id") or f"P_{uuid.uuid4().hex[:8]}"

    db = SessionLocal()
    try:
        user = db.query(dbmodels.Participant).filter_by(participant_id=pid).first()
        if not user:
            group = np.random.choice(["control", "pid"])
            user = dbmodels.Participant(participant_id=pid, assignment_group=group)
            db.add(user)
            db.commit()
            db.refresh(user)
        # respond with primitive attributes only (safe)
        return jsonify({"ok": True, "participant_id": user.participant_id, "group": user.assignment_group})
    finally:
        db.close()

###############################################################
# CREATE SESSION
###############################################################

@app.route("/api/session", methods=["POST"])
def new_session():
    data = request.get_json() or {}
    pid = data.get("participant_id")

    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400

    db = SessionLocal()
    try:
        p = db.query(dbmodels.Participant).filter_by(participant_id=pid).first()
        if not p:
            p = dbmodels.Participant(participant_id=pid, assignment_group="control")
            db.add(p)
            db.commit()

        session = dbmodels.Session(
            participant_id=pid,
            token=gen_token(),
            expires_at=datetime.utcnow() + timedelta(hours=12),
            ema_high=0.0
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # initialize controllers in-memory
        pid_controllers[pid] = PIDController()
        difficulty_state[pid] = 2

        out = {"token": session.token, "expires_at": session.expires_at.isoformat()}
        return jsonify({"ok": True, "data": out})
    finally:
        db.close()

###############################################################
# STRESS ENDPOINT (logs stress events)
###############################################################

@app.route("/api/stress", methods=["POST"])
def stress_api():
    data = request.get_json() or {}
    rr = data.get("rr_intervals_ms")

    if not rr:
        return jsonify({"ok": False, "error": "rr_intervals_ms required"}), 400

    prediction = infer_stress(rr)

    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else auth

    db = SessionLocal()
    smoothed = None
    try:
        session_row = db.query(dbmodels.Session).filter_by(token=token).first()
        if session_row:
            db.refresh(session_row)
            pid = session_row.participant_id

            prev = session_row.ema_high or 0
            p_high = float(prediction["proba"][-1])
            new_ema = EMA_ALPHA*p_high + (1-EMA_ALPHA)*prev
            session_row.ema_high = new_ema
            db.commit()
            db.refresh(session_row)

            smoothed_label = 2 if new_ema>=0.5 else (1 if new_ema>=0.2 else 0)
            smoothed = {"ema_high": new_ema, "smoothed_label": smoothed_label}

            ctrl = pid_controllers.get(pid, PIDController())
            delta = ctrl.step(new_ema)
            new_diff = max(1, min(5, round(difficulty_state.get(pid, 2)+delta)))
            difficulty_state[pid] = new_diff

            # log the stress event (persist)
            append_log_db(db, pid, {
                "session_token": token,
                "prediction": prediction,
                "smoothed": smoothed,
                "difficulty": new_diff,
                "features": prediction["features"],
                "event": "stress_update",
                "task": "stress"
            })

            # emit updates (primitive values only)
            try:
                socketio.emit(f"stress_update_{pid}", {"ema_high": new_ema, "proba": prediction["proba"]}, room=f"room_{pid}")
                socketio.emit(f"difficulty_update_{pid}", {"difficulty": new_diff}, room=f"room_{pid}")
            except Exception as e:
                logger.exception("socket emit error: %s", e)

        return jsonify({"ok": True, "raw": prediction, "smoothed": smoothed})
    finally:
        db.close()

###############################################################
# TASK ENGINE (start, event, finish)
###############################################################

@app.route("/api/task/start", methods=["POST"])
def task_start():
    data = request.get_json() or {}
    token = data.get("token") or (request.headers.get("Authorization") or "").replace("Bearer ", "")

    db = SessionLocal()
    try:
        session_row = db.query(dbmodels.Session).filter_by(token=token).first()
        if not session_row:
            return jsonify({"ok": False, "error": "invalid session"}), 401

        pid = session_row.participant_id
        ts = dbmodels.TaskSession(
            participant_id=pid,
            task_name=data.get("task"),
            config=data.get("config") or {},
            difficulty_history=[],
            stress_history=[]
        )
        db.add(ts)
        db.commit()
        db.refresh(ts)

        # capture primitive id before closing
        session_id = ts.id
    finally:
        db.close()

    # safe to emit using captured session_id and pid
    try:
        socketio.emit(f"task_event_{pid}", {"event": "task_start", "session_id": session_id}, room=f"room_{pid}")
    except Exception:
        logger.exception("socket emit task_start failed")

    return jsonify({"ok": True, "session_id": session_id})

@app.route("/api/task/event", methods=["POST"])
def task_event():
    data = request.get_json() or {}
    token = data.get("token") or (request.headers.get("Authorization") or "").replace("Bearer ", "")

    db = SessionLocal()
    try:
        session_row = db.query(dbmodels.Session).filter_by(token=token).first()
        if not session_row:
            return jsonify({"ok": False, "error": "invalid session"}), 401

        pid = session_row.participant_id
        ts = db.query(dbmodels.TaskSession).filter_by(id=data.get("session_id")).first()
        if not ts:
            return jsonify({"ok": False, "error": "session not found"}), 404

        difficulty = difficulty_state.get(pid, 2)
        stress = session_row.ema_high or 0

        tr = dbmodels.TaskTrial(
            session_id=ts.id,
            trial_index=data.get("trial_index"),
            stimulus=data.get("stimulus") or data.get("stim") or {},
            response=data.get("response"),
            correct=data.get("correct"),
            reaction_time_ms=data.get("reaction_time_ms"),
            difficulty_level=difficulty,
            stress_level=stress
        )
        db.add(tr)

        if ts.difficulty_history is None:
            ts.difficulty_history = []
        if ts.stress_history is None:
            ts.stress_history = []

        ts.difficulty_history.append({"trial": data.get("trial_index"), "difficulty": difficulty})
        ts.stress_history.append({"trial": data.get("trial_index"), "stress": float(stress)})

        db.commit()

        # capture values for emit
        trial_index = data.get("trial_index")
        correct = data.get("correct")
        reaction_time_ms = data.get("reaction_time_ms")
    finally:
        db.close()

    try:
        socketio.emit(f"task_event_{pid}", {
            "event": "trial",
            "trial_index": trial_index,
            "difficulty": difficulty,
            "stress": float(stress),
            "correct": correct,
            "reaction_time_ms": reaction_time_ms,
        }, room=f"room_{pid}")
    except Exception:
        logger.exception("socket emit task_event failed")

    return jsonify({"ok": True})

@app.route("/api/task/finish", methods=["POST"])
def task_finish():
    data = request.get_json() or {}
    token = data.get("token") or (request.headers.get("Authorization") or "").replace("Bearer ", "")

    db = SessionLocal()
    try:
        session_row = db.query(dbmodels.Session).filter_by(token=token).first()
        if not session_row:
            return jsonify({"ok": False, "error": "invalid session"}), 401

        pid = session_row.participant_id
        ts = db.query(dbmodels.TaskSession).filter_by(id=data.get("session_id")).first()
        if not ts:
            return jsonify({"ok": False, "error": "session not found"}), 404

        ts.end_time = datetime.utcnow()
        db.commit()

        session_id = ts.id
    finally:
        db.close()

    try:
        socketio.emit(f"task_event_{pid}", {"event": "task_finish", "session_id": session_id}, room=f"room_{pid}")
    except Exception:
        logger.exception("socket emit task_finish failed")

    return jsonify({"ok": True})

###############################################################
# SOCKET.IO EVENTS
###############################################################

@socketio.on("join_participant_room")
def join_room_evt(data):
    pid = data.get("participant_id")
    if pid:
        join_room(f"room_{pid}")
        emit("joined", {"room": f"room_{pid}"})

@socketio.on("leave_participant_room")
def leave_room_evt(data):
    pid = data.get("participant_id")
    if pid:
        leave_room(f"room_{pid}")

@socketio.on("face_metrics")
def face_metrics_event(data):
    pid = data.get("participant_id")
    if not pid:
        return

    db = SessionLocal()
    try:
        append_log_db(db, pid, {
            "event": "face_metrics",
            "task": "camera",
            "features": {
                "pupil_size": data.get("pupil_size"),
                "blink_count": data.get("blink_count")
            },
            "session_token": data.get("session_token")
        })
    finally:
        db.close()

    try:
        socketio.emit(f"face_update_{pid}", data, room=f"room_{pid}")
    except Exception:
        logger.exception("socket emit face_update failed")

###############################################################
# LOAD ADMIN EXTRA BLUEPRINT (if present)
###############################################################

try:
    from routes.admin_extra import bp as admin_extra_bp  # type: ignore
    app.register_blueprint(admin_extra_bp)
except Exception as e:
    logger.info("admin_extra not loaded: %s", e)

###############################################################
# ERROR HANDLER
###############################################################

@app.errorhandler(Exception)
def global_error(e):
    logger.exception("Exception: %s", e)
    return jsonify({"ok": False, "error": "internal server error"}), 500

###############################################################
# RUN SERVER
###############################################################

if __name__ == "__main__":
    logger.info("Backend running at 0.0.0.0:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
