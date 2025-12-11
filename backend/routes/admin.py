from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt, io, csv, json
from sqlalchemy.orm import Session as DBSession
from ..database.models import AdminUser, Participant, Session as DBSessionModel, TaskLog, StressLog
from ..database.base import get_engine, get_session_local

admin_bp = Blueprint("admin", __name__)

JWT_SECRET = current_app.config.get("JWT_SECRET", "dev-secret")
JWT_ALGO = "HS256"
JWT_EXP_MINUTES = 720

def create_jwt(payload):
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)
    payload.update({"exp": exp})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        token = None
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
        if not token:
            return jsonify({"ok": False, "error": "missing token"}), 401
        try:
            payload = jwt.decode(token, current_app.config.get("JWT_SECRET", "dev-secret"), algorithms=[JWT_ALGO])
            # optionally validate user exists
        except Exception as e:
            return jsonify({"ok": False, "error": "invalid token", "detail": str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper

@admin_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"ok": False, "error": "username/password required"}), 400

    engine = get_engine()
    SessionLocal = get_session_local()
    db: DBSession = SessionLocal()
    try:
        user = db.query(AdminUser).filter(AdminUser.username == username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"ok": False, "error": "invalid credentials"}), 401
        token = create_jwt({"sub": user.username})
        return jsonify({"ok": True, "data": {"token": token}})
    finally:
        db.close()

@admin_bp.route("/participants", methods=["GET"])
@admin_required
def participants_list():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        q = db.query(Participant).order_by(Participant.created_at.desc()).limit(500)
        rows = []
        for p in q:
            rows.append({
                "participant_id": p.participant_id,
                "assignment_group": p.assignment_group,
                "created_at": p.created_at.isoformat()
            })
        return jsonify({"ok": True, "data": rows})
    finally:
        db.close()

@admin_bp.route("/export/json/<participant_id>", methods=["GET"])
@admin_required
def export_json(participant_id):
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        logs = db.query(TaskLog).filter(TaskLog.participant_id == participant_id).order_by(TaskLog.timestamp.asc()).all()
        stress = db.query(StressLog).filter(StressLog.participant_id == participant_id).order_by(StressLog.timestamp.asc()).all()
        out = {
            "participant_id": participant_id,
            "task_logs": [ { "task_name": l.task_name, "trial": l.trial_index, "event": l.event, "correct": l.correct, "rt": l.reaction_time_ms, "ts": l.timestamp.isoformat(), "extra": l.extra } for l in logs ],
            "stress_logs": [ { "ema_high": s.ema_high, "raw_proba": s.raw_proba, "smoothed_label": s.smoothed_label, "difficulty": s.difficulty, "ts": s.timestamp.isoformat() } for s in stress ]
        }
        bio = io.BytesIO()
        bio.write(json.dumps(out, default=str, indent=2).encode("utf-8"))
        bio.seek(0)
        return send_file(bio, download_name=f"{participant_id}_export.json", as_attachment=True, mimetype="application/json")
    finally:
        db.close()

@admin_bp.route("/export/csv/<participant_id>", methods=["GET"])
@admin_required
def export_csv(participant_id):
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        logs = db.query(TaskLog).filter(TaskLog.participant_id == participant_id).order_by(TaskLog.timestamp.asc()).all()
        bio = io.StringIO()
        writer = csv.writer(bio)
        writer.writerow(["participant_id","task_name","trial","event","correct","reaction_time_ms","timestamp","extra"])
        for l in logs:
            writer.writerow([l.participant_id, l.task_name, l.trial_index, l.event, l.correct, l.reaction_time_ms, l.timestamp.isoformat(), json.dumps(l.extra or {})])
        bio.seek(0)
        return send_file(io.BytesIO(bio.getvalue().encode("utf-8")), download_name=f"{participant_id}_tasklogs.csv", as_attachment=True, mimetype="text/csv")
    finally:
        db.close()
