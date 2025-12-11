from flask import Blueprint, request, jsonify, send_file
from functools import wraps
from datetime import datetime, timedelta
import os, time, json, csv, io

# import state and DB objects from app (app.py defines SessionLocal, socketio, User, SessionToken, Participant, LogEntry)
try:
    from app import SessionLocal, socketio, JWT_SECRET, JWT_EXP_MINUTES, PIDController, difficulty_state
    from app import User, SessionToken, Participant, LogEntry, engine
    from app import create_admin_jwt, require_jwt_admin, gen_token
except Exception as e:
    # if import fails, try relative (depends on how app is structured)
    from ..app import SessionLocal, socketio, JWT_SECRET, JWT_EXP_MINUTES, PIDController, difficulty_state
    from ..app import User, SessionToken, Participant, LogEntry, engine
    from ..app import create_admin_jwt, require_jwt_admin, gen_token

bp = Blueprint("admin_extra", __name__)

# Simple experiment controller state (in-memory)
if not hasattr(bp, "_experiment_state"):
    bp._experiment_state = {"status": "idle", "updated_at": datetime.utcnow().isoformat()}

def admin_required_json(f):
    # simply reuse require_jwt_admin which sets request.admin_user
    @wraps(f)
    def inner(*args, **kwargs):
        return f(*args, **kwargs)
    return inner

@bp.route("/admin/experiment/start", methods=["POST"])
@require_jwt_admin
def experiment_start():
    db = SessionLocal()
    try:
        bp._experiment_state["status"] = "running"
        bp._experiment_state["updated_at"] = datetime.utcnow().isoformat()
        socketio.emit("experiment_state", bp._experiment_state, broadcast=True)
        return jsonify({"ok": True, "data": bp._experiment_state})
    finally:
        db.close()

@bp.route("/admin/experiment/pause", methods=["POST"])
@require_jwt_admin
def experiment_pause():
    db = SessionLocal()
    try:
        bp._experiment_state["status"] = "paused"
        bp._experiment_state["updated_at"] = datetime.utcnow().isoformat()
        socketio.emit("experiment_state", bp._experiment_state, broadcast=True)
        return jsonify({"ok": True, "data": bp._experiment_state})
    finally:
        db.close()

@bp.route("/admin/experiment/stop", methods=["POST"])
@require_jwt_admin
def experiment_stop():
    db = SessionLocal()
    try:
        bp._experiment_state["status"] = "stopped"
        bp._experiment_state["updated_at"] = datetime.utcnow().isoformat()
        socketio.emit("experiment_state", bp._experiment_state, broadcast=True)
        return jsonify({"ok": True, "data": bp._experiment_state})
    finally:
        db.close()

@bp.route("/admin/active_sessions", methods=["GET"])
@require_jwt_admin
def active_sessions():
    db = SessionLocal()
    try:
        # sessions with expires_at > now
        now = datetime.utcnow()
        rows = db.query(SessionToken).filter(SessionToken.expires_at >= now).all()
        out = []
        for s in rows:
            participant_id = s.participant.participant_id if getattr(s, "participant", None) else None
            out.append({
                "token": s.token,
                "participant_id": participant_id,
                "expires_at": s.expires_at.isoformat(),
                "created_at": s.created_at.isoformat()
            })
        return jsonify({"ok": True, "data": out})
    finally:
        db.close()

@bp.route("/admin/settings/change_password", methods=["POST"])
@require_jwt_admin
def change_password():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    new_password = data.get("new_password")
    if not username or not new_password:
        return jsonify({"ok": False, "error": "username and new_password required"}), 400
    db = SessionLocal()
    try:
        u = db.query(User).filter_by(username=username).first()
        if not u:
            return jsonify({"ok": False, "error": "user not found"}), 404
        from werkzeug.security import generate_password_hash
        u.password_hash = generate_password_hash(new_password)
        db.add(u); db.commit()
        return jsonify({"ok": True, "data": {"username": username}})
    finally:
        db.close()

@bp.route("/admin/room/join", methods=["POST"])
@require_jwt_admin
def admin_join_room():
    data = request.get_json(silent=True) or {}
    pid = data.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    # instruct server to emit to this room - join is client-side for sockets
    return jsonify({"ok": True, "data": {"room": f"room_{pid}"}})

# optional: improved export endpoint (stream CSV)
@bp.route("/admin/export_stream", methods=["GET"])
@require_jwt_admin
def export_stream():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    task = request.args.get("task")
    db = SessionLocal()
    try:
        q = db.query(LogEntry).filter(LogEntry.participant_id == pid)
        if task: q = q.filter(LogEntry.task == task)
        q = q.order_by(LogEntry.timestamp.asc())
        # stream CSV in memory
        si = io.StringIO()
        writer = csv.writer(si)
        writer.writerow(["id","participant_id","timestamp","task","trial","event","smoothed_high","rmssd","mean_hr","accuracy","payload"])
        for r in q:
            writer.writerow([r.id, r.participant_id, r.timestamp.isoformat(), r.task, r.trial, r.event, r.smoothed_high, r.rmssd, r.mean_hr, r.accuracy, r.payload])
        si.seek(0)
        return send_file(io.BytesIO(si.getvalue().encode("utf-8")), as_attachment=True, download_name=f"{pid}_logs.csv", mimetype="text/csv")
    finally:
        db.close()
