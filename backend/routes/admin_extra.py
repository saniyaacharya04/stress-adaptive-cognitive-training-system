# backend/routes/admin_extra.py

import os
import jwt
from flask import Blueprint, request, jsonify
from database.base import SessionLocal
from database import models as dbmodels

bp = Blueprint("admin_extra", __name__, url_prefix="/api/admin/extra")

JWT_SECRET = os.environ.get("JWT_SECRET", "change_this_secret")

def decode_admin_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        return None

def require_admin_local(req):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return False, "missing token"
    token = auth.split(" ", 1)[1]
    payload = decode_admin_token(token)
    if not payload:
        return False, "invalid or expired token"
    if payload.get("role") != "admin":
        return False, "admin required"
    return True, payload.get("sub")

@bp.route("/stats", methods=["GET"])
def stats():
    ok, info = require_admin_local(request)
    if not ok:
        return jsonify({"ok": False, "error": info}), 401

    db = SessionLocal()
    try:
        participants = db.query(dbmodels.Participant).count()
        sessions = db.query(dbmodels.Session).count()
        stress_logs = db.query(dbmodels.StressLog).count()
        task_sessions = db.query(dbmodels.TaskSession).count()
        task_trials = db.query(dbmodels.TaskTrial).count()

        data = {
            "participants": participants,
            "sessions": sessions,
            "stress_logs": stress_logs,
            "task_sessions": task_sessions,
            "task_trials": task_trials
        }
        return jsonify({"ok": True, "data": data})
    finally:
        db.close()
