from flask import Blueprint, request, jsonify, send_file
from functools import wraps
from datetime import datetime
import io, csv, json, zipfile, os, jwt

from backend.database.base import SessionLocal
from backend.database.models import Participant, TaskLog, StressLog

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

JWT_SECRET = os.environ.get("JWT_SECRET", "change_this_secret")

def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"ok": False, "error": "missing token"}), 401
        try:
            payload = jwt.decode(auth.split(" ",1)[1], JWT_SECRET, algorithms=["HS256"])
        except Exception:
            return jsonify({"ok": False, "error": "invalid token"}), 401
        if payload.get("role") != "admin":
            return jsonify({"ok": False, "error": "admin required"}), 403
        return fn(*args, **kwargs)
    return wrapper

def collect_logs(db, pid):
    rows = []
    for t in db.query(TaskLog).filter_by(participant_id=pid).all():
        rows.append({
            "timestamp": t.timestamp.isoformat(),
            "task": t.task_name,
            "trial": t.trial_index,
            "event": t.event,
            "extra": t.extra
        })
    for s in db.query(StressLog).filter_by(participant_id=pid).all():
        rows.append({
            "timestamp": s.timestamp.isoformat(),
            "task": "stress",
            "trial": None,
            "event": "stress",
            "extra": s.features
        })
    rows.sort(key=lambda r: r["timestamp"])
    return rows

@bp.route("/participants", methods=["GET"])
@require_admin
def participants():
    db = SessionLocal()
    try:
        data = [{
            "participant_id": p.participant_id,
            "created_at": p.created_at.isoformat(),
            "assignment_group": p.assignment_group
        } for p in db.query(Participant).all()]
        return jsonify({"ok": True, "data": data})
    finally:
        db.close()

@bp.route("/export", methods=["GET"])
@require_admin
def export_csv():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        rows = collect_logs(db, pid)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["timestamp","task","trial","event","extra"])
        for r in rows:
            w.writerow([r["timestamp"], r["task"], r["trial"], r["event"], json.dumps(r["extra"])])
        mem = io.BytesIO(buf.getvalue().encode())
        return send_file(mem, as_attachment=True, download_name=f"{pid}.csv")
    finally:
        db.close()

@bp.route("/export_all", methods=["GET"])
@require_admin
def export_all():
    db = SessionLocal()
    try:
        mem = io.BytesIO()
        z = zipfile.ZipFile(mem, "w")
        for p in db.query(Participant).all():
            rows = collect_logs(db, p.participant_id)
            csv_text = "\n".join([json.dumps(r) for r in rows])
            z.writestr(f"{p.participant_id}.json", csv_text)
        z.close()
        mem.seek(0)
        return send_file(mem, as_attachment=True, download_name="all_logs.zip")
    finally:
        db.close()
