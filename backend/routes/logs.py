from flask import Blueprint, request, jsonify, current_app
from ..database.base import get_session_local
from ..database.models import TaskLog, StressLog
from datetime import datetime
import json

logs_bp = Blueprint("logs", __name__)

@logs_bp.route("/log", methods=["POST"])
def post_log():
    data = request.get_json() or {}
    participant_id = data.get("participant_id") or data.get("pid")
    session_token = data.get("session_token")
    logs = data.get("logs") or []
    if not participant_id or not isinstance(logs, list):
        return jsonify({"ok": False, "error": "participant_id and logs list required"}), 400
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        saved = 0
        for e in logs:
            tl = TaskLog(
                participant_id=participant_id,
                session_token=session_token,
                task_name=e.get("task"),
                trial_index=e.get("trial"),
                event=e.get("event"),
                correct=bool(e.get("correct")),
                reaction_time_ms=e.get("reaction_time_ms"),
                extra=e.get("extra")
            )
            db.add(tl)
            saved += 1
        db.commit()
        return jsonify({"ok": True, "saved": saved})
    finally:
        db.close()

@logs_bp.route("/stress", methods=["POST"])
def post_stress():
    # this is a light wrapper that existing /api/stress can call into or vice versa
    data = request.get_json() or {}
    participant_id = data.get("participant_id")
    session_token = data.get("session_token")
    raw_proba = data.get("raw_proba")
    ema_high = data.get("ema_high")
    smoothed_label = data.get("smoothed_label")
    difficulty = data.get("difficulty")
    features = data.get("features")
    if not participant_id:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        s = StressLog(
            participant_id=participant_id,
            session_token=session_token,
            raw_proba=raw_proba,
            ema_high=ema_high,
            smoothed_label=smoothed_label,
            difficulty=difficulty,
            features=features
        )
        db.add(s)
        db.commit()
        return jsonify({"ok": True, "saved": True})
    finally:
        db.close()
