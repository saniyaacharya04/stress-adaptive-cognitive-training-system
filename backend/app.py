# backend/app.py
import eventlet
eventlet.monkey_patch()

import os
import json
import time
import uuid
import numpy as np
import joblib
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

# Import DB engine/session and models from canonical location
from database.base import engine, SessionLocal, Base
from database import models as dbmodels

# Config
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.environ.get("DATABASE_URL") or f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"
JWT_SECRET = os.environ.get("JWT_SECRET", "please_change_this_secret")
JWT_EXP_MINUTES = int(os.environ.get("JWT_EXP_MINUTES", "720"))
EMA_ALPHA = float(os.environ.get("EMA_ALPHA", 0.3))
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

# Ensure tables exist in the single engine
Base.metadata.create_all(bind=engine)

# Attempt to load RF model if present
MODEL_RF_PATH = os.path.join(BASE_DIR, "models", "stress_rf_model.pkl")
clf_rf = None
if os.path.exists(MODEL_RF_PATH):
    try:
        clf_rf = joblib.load(MODEL_RF_PATH)
        print("Loaded RF model.")
    except Exception as e:
        print("Could not load RF model:", e)

# Helpers
def gen_token():
    return uuid.uuid4().hex

def create_admin_jwt(username, role="admin"):
    payload = {"sub": username, "role": role, "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def decode_jwt(token):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def require_jwt_admin(f):
    @wraps(f)
    def inner(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        token = None
        if auth.startswith("Bearer "):
            token = auth.split(" ",1)[1]
        if not token:
            return jsonify({"ok": False, "error": "missing token"}), 401
        try:
            payload = decode_jwt(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"ok": False, "error": "token expired"}), 401
        except Exception as e:
            return jsonify({"ok": False, "error": f"invalid token: {e}"}), 401
        if payload.get("role") != "admin":
            return jsonify({"ok": False, "error": "admin required"}), 403
        request.admin_user = payload.get("sub")
        return f(*args, **kwargs)
    return inner

# Feature extraction and inference (kept simple)
def rr_to_features_simple(rr_ms):
    rr = np.array(rr_ms, dtype=float)
    if rr.size < 2:
        return {"rmssd": None, "sdnn": None, "mean_rr": None, "mean_hr": None}
    diff = np.diff(rr)
    rmssd = float(np.sqrt(np.mean(diff**2)))
    sdnn = float(np.std(rr))
    mean_rr = float(np.mean(rr))
    mean_hr = float(60000.0 / mean_rr) if mean_rr != 0 else None
    return {"rmssd": rmssd, "sdnn": sdnn, "mean_rr": mean_rr, "mean_hr": mean_hr}

def infer_from_rr(rr_ms):
    features = rr_to_features_simple(rr_ms)
    res = {"label":0, "proba":[1.0,0.0,0.0], "features":features}
    try:
        if clf_rf is not None:
            X = np.array([[features["rmssd"] or 0.0, features["sdnn"] or 0.0, features["mean_rr"] or 0.0, features["mean_hr"] or 0.0]])
            p = clf_rf.predict_proba(X)[0].tolist()
            res.update({"label": int(np.argmax(p)), "proba": p})
    except Exception as e:
        print("inference error", e)
    return res

# PID controller (kept)
class PIDController:
    def __init__(self, Kp=0.8, Ki=0.06, Kd=0.2, target=0.35):
        self.Kp, self.Ki, self.Kd = Kp, Ki, Kd
        self.target = target
        self.integral = 0.0
        self.prev_error = 0.0
        self.last_time = None
    def step(self, measured):
        t = time.time()
        if self.last_time is None:
            self.last_time = t
            self.prev_error = self.target - measured
            return 0.0
        dt = max(1e-3, t - self.last_time)
        self.last_time = t
        error = self.target - measured
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt
        output = self.Kp*error + self.Ki*self.integral + self.Kd*derivative
        self.prev_error = error
        return output

pid_controllers = {}
difficulty_state = {}

# DB helpers (use canonical models)
def create_participant_if_missing(db, participant_id):
    p = db.query(dbmodels.Participant).filter_by(participant_id=participant_id).first()
    if p:
        return p
    group = np.random.choice(["control", "pid"])
    p = dbmodels.Participant(participant_id=participant_id, assignment_group=group)
    db.add(p); db.commit(); db.refresh(p)
    return p

def create_session(db, participant_obj, ttl_minutes=180):
    token = gen_token()
    expires = datetime.utcnow() + timedelta(minutes=ttl_minutes)
    s = dbmodels.Session(participant_id=participant_obj.participant_id, token=token, expires_at=expires)
    db.add(s); db.commit(); db.refresh(s)
    return s

def validate_session(db, token):
    if not token:
        return None
    s = db.query(dbmodels.Session).filter_by(token=token).first()
    if not s:
        return None
    if s.expires_at and s.expires_at < datetime.utcnow():
        db.delete(s); db.commit(); return None
    return s

def append_log_db(db, pid, obj):
    task = obj.get("task")
    trial = obj.get("trial")
    event = obj.get("event")
    smoothed = obj.get("smoothed", {})
    sm_high = smoothed.get("ema_high") if isinstance(smoothed, dict) else None
    features = obj.get("features") or (obj.get("prediction",{}) or {}).get("features") or {}
    rmssd = features.get("rmssd")
    mean_hr = features.get("mean_hr")
    accuracy = obj.get("accuracy") if obj.get("accuracy") is not None else (1.0 if obj.get("correct") else (0.0 if obj.get("correct") is False else None))
    tl = dbmodels.TaskLog(
        participant_id=pid,
        session_token=obj.get("session_token"),
        task_name=task, trial_index=trial, event=event,
        correct=obj.get("correct"),
        reaction_time_ms=obj.get("reaction_time_ms"),
        extra=obj.get("extra")
    )
    db.add(tl); db.commit(); db.refresh(tl)
    # optional: also store a StressLog entry when provided
    if sm_high is not None:
        sl = dbmodels.StressLog(
            participant_id=pid,
            session_token=obj.get("session_token"),
            raw_proba=obj.get("prediction", {}).get("proba") if obj.get("prediction") else None,
            ema_high=sm_high,
            smoothed_label=obj.get("smoothed", {}).get("smoothed_label"),
            difficulty=obj.get("difficulty"),
            features=features
        )
        db.add(sl); db.commit(); db.refresh(sl)
    return tl

# Flask + SocketIO
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/")
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# Health
@app.route("/healthz")
def health():
    return jsonify({"ok": True, "status": "healthy"})

# Admin login (uses AdminUser)
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username"); password = data.get("password")
    if not username or not password:
        return jsonify({"ok": False, "error": "username & password required"}), 400
    db = SessionLocal()
    try:
        user = db.query(dbmodels.AdminUser).filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"ok": False, "error": "invalid credentials"}), 401
        token = create_admin_jwt(user.username, role="admin")
        return jsonify({"ok": True, "data": {"token": token, "role": "admin"}})
    finally:
        db.close()

# Participant registration and session creation
@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    pid = data.get("participant_id") or f"P_{uuid.uuid4().hex[:8]}"
    db = SessionLocal()
    try:
        p = create_participant_if_missing(db, pid)
        return jsonify({"ok": True, "data": {"participant_id": p.participant_id, "assignment_group": p.assignment_group}})
    finally:
        db.close()

@app.route("/api/session", methods=["POST"])
def api_session():
    data = request.get_json(silent=True) or {}
    pid = data.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        p = create_participant_if_missing(db, pid)
        s = create_session(db, p)
        difficulty_state[p.participant_id] = 2
        pid_controllers[p.participant_id] = PIDController()
        return jsonify({"ok": True, "data": {"token": s.token, "participant_id": p.participant_id, "expires_at": s.expires_at.isoformat() if s.expires_at else None}})
    finally:
        db.close()

# Stress inference endpoint
@app.route("/api/stress", methods=["GET","POST"])
def api_stress():
    db = SessionLocal()
    try:
        if request.method == "GET":
            sim = request.args.get("sim","false").lower() == "true"
            if sim:
                import random
                label = random.choices([0,1,2], weights=[0.5,0.35,0.15])[0]
                features = {"rmssd": (60 if label==0 else 40 if label==1 else 18) + random.gauss(0,5)}
                return jsonify({"ok": True, "data": {"raw": {"label": label, "proba": [0,0,0], "features": features}}})
            return jsonify({"ok": True, "data": {"raw": {"label":0, "proba":[1,0,0], "features":{}}}})
        data = request.get_json(silent=True) or {}
        rr = data.get("rr_intervals_ms") or data.get("rr") or []
        if not isinstance(rr, list) or len(rr) == 0:
            return jsonify({"ok": False, "error": "Provide rr_intervals_ms: [..]"}), 400
        res = infer_from_rr(rr)
        token = request.headers.get("Authorization") or request.args.get("token")
        smoothed = None
        if token:
            if token.startswith("Bearer "): token = token.split(" ",1)[1]
            s = validate_session(db, token)
            if s:
                prev = s.ema_high or 0.0
                p_high = float(res.get("proba", [0,0,0])[-1])
                new_ema = EMA_ALPHA * p_high + (1.0 - EMA_ALPHA) * prev
                s.ema_high = float(new_ema); db.add(s); db.commit(); db.refresh(s)
                smoothed_label = 2 if new_ema >= 0.5 else (1 if new_ema >= 0.2 else 0)
                smoothed = {"ema_high": new_ema, "smoothed_label": smoothed_label}
                entry = {"timestamp": datetime.utcnow().isoformat(), "event": "rr_window", "rr_count": len(rr), "prediction": res, "smoothed": smoothed, "features": res.get("features")}
                # append log
                append_log_db(db, s.participant.participant_id, entry)
                # emit to room
                socketio.emit(f"stress_update_{s.participant.participant_id}", {"timestamp": datetime.utcnow().isoformat(), "participant_id": s.participant.participant_id, "ema_high": new_ema, "raw_proba": res.get("proba")}, room=f"room_{s.participant.participant_id}")
                # PID difficulty tuning
                ctrl = pid_controllers.get(s.participant.participant_id)
                if ctrl is None:
                    ctrl = PIDController()
                    pid_controllers[s.participant.participant_id] = ctrl
                out = ctrl.step(new_ema)
                prev_d = difficulty_state.get(s.participant.participant_id, 2)
                new_d = max(1, min(5, round(prev_d + out)))
                difficulty_state[s.participant.participant_id] = new_d
                socketio.emit(f"difficulty_update_{s.participant.participant_id}", {"difficulty": new_d}, room=f"room_{s.participant.participant_id}")
        out = {"raw": res}
        if smoothed:
            out["smoothed"] = smoothed
        return jsonify({"ok": True, "data": out})
    finally:
        db.close()

# Logging endpoint
@app.route("/api/log", methods=["POST"])
def api_log():
    data = request.get_json(silent=True) or {}
    token = request.headers.get("Authorization") or data.get("token") or request.args.get("token")
    db = SessionLocal()
    try:
        pid = None
        if token:
            if token.startswith("Bearer "): token = token.split(" ",1)[1]
            s = validate_session(db, token)
            if s: pid = s.participant.participant_id
        if not pid:
            pid = data.get("participant_id")
        if not pid:
            return jsonify({"ok": False, "error": "participant_id or valid session token required"}), 400
        logs = data.get("logs") or []
        if not isinstance(logs, list):
            return jsonify({"ok": False, "error": "logs must be a list"}), 400
        saved = 0
        for entry in logs:
            if "timestamp" not in entry:
                entry["timestamp"] = datetime.utcnow().isoformat()
            append_log_db(db, pid, entry)
            socketio.emit(f"task_event_{pid}", entry, room=f"room_{pid}")
            saved += 1
        return jsonify({"ok": True, "saved": saved})
    finally:
        db.close()

# Admin protected endpoints
@app.route("/api/admin/participants", methods=["GET"])
@require_jwt_admin
def admin_participants():
    db = SessionLocal()
    try:
        parts = db.query(dbmodels.Participant).all()
        return jsonify({"ok": True, "data": [{"participant_id": p.participant_id, "created_at": p.created_at.isoformat(), "assignment_group": p.assignment_group} for p in parts]})
    finally:
        db.close()

@app.route("/api/admin/logs/query", methods=["POST"])
@require_jwt_admin
def admin_query_logs():
    data = request.get_json(silent=True) or {}
    pid = data.get("participant_id"); task = data.get("task"); limit = int(data.get("limit",500))
    from_ts = data.get("from_ts"); to_ts = data.get("to_ts")
    db = SessionLocal()
    try:
        q = db.query(dbmodels.TaskLog)
        if pid: q = q.filter(dbmodels.TaskLog.participant_id == pid)
        if task: q = q.filter(dbmodels.TaskLog.task_name == task)
        if from_ts: q = q.filter(dbmodels.TaskLog.timestamp >= datetime.fromisoformat(from_ts))
        if to_ts: q = q.filter(dbmodels.TaskLog.timestamp <= datetime.fromisoformat(to_ts))
        q = q.order_by(dbmodels.TaskLog.timestamp.desc()).limit(limit)
        rows = []
        for r in q.all():
            rows.append({"id": r.id, "participant_id": r.participant_id, "timestamp": r.timestamp.isoformat(), "task": r.task_name, "trial": r.trial_index, "event": r.event, "payload": r.extra, "correct": r.correct, "reaction_time_ms": r.reaction_time_ms})
        return jsonify({"ok": True, "data": rows})
    finally:
        db.close()

@app.route("/api/admin/export", methods=["GET"])
@require_jwt_admin
def admin_export():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    task = request.args.get("task"); from_ts = request.args.get("from_ts"); to_ts = request.args.get("to_ts")
    db = SessionLocal()
    try:
        q = db.query(dbmodels.TaskLog).filter(dbmodels.TaskLog.participant_id == pid)
        if task: q = q.filter(dbmodels.TaskLog.task_name == task)
        if from_ts: q = q.filter(dbmodels.TaskLog.timestamp >= datetime.fromisoformat(from_ts))
        if to_ts: q = q.filter(dbmodels.TaskLog.timestamp <= datetime.fromisoformat(to_ts))
        q = q.order_by(dbmodels.TaskLog.timestamp.asc())
        tmp = os.path.join(BASE_DIR, f"{pid}_export_{int(time.time())}.csv")
        import csv
        with open(tmp, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id","participant_id","timestamp","task","trial","event","payload","correct","reaction_time_ms"])
            for r in q.all():
                w.writerow([r.id, r.participant_id, r.timestamp.isoformat(), r.task_name, r.trial_index, r.event, json.dumps(r.extra or {}), r.correct, r.reaction_time_ms])
        return send_file(tmp, as_attachment=True, download_name=f"{pid}_logs.csv")
    finally:
        db.close()

# Socket handlers
@socketio.on("join_participant_room")
def handle_join(data):
    pid = data.get("participant_id")
    if not pid: return
    join_room(f"room_{pid}")
    emit("joined", {"ok": True, "room": f"room_{pid}"})

@socketio.on("leave_participant_room")
def handle_leave(data):
    pid = data.get("participant_id")
    if pid: leave_room(f"room_{pid}")

@socketio.on("face_metrics")
def handle_face_metrics(data):
    pid = data.get("participant_id")
    if not pid: return
    db = SessionLocal()
    try:
        entry = {"timestamp": data.get("timestamp", datetime.utcnow().isoformat()), "event": "face_metrics", "task": "camera", "features": {"pupil_size": data.get("pupil_size"), "blink_count": data.get("blink_count")}}
        append_log_db(db, pid, entry)
        socketio.emit(f"face_update_{pid}", {"participant_id": pid, "timestamp": entry["timestamp"], "pupil_size": data.get("pupil_size"), "blink_count": data.get("blink_count")}, room=f"room_{pid}")
    finally:
        db.close()

# Run
if __name__ == "__main__":
    print("Starting app on 0.0.0.0:5000")
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
# Register extra admin endpoints
try:
    from routes.admin_extra import bp as admin_extra_bp
    app.register_blueprint(admin_extra_bp)
except Exception as _:
    print("admin_extra blueprint registration failed or already present")
