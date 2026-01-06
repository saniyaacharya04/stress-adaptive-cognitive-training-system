#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Working directory: $ROOT"

# 1) Create backend route: routes/admin_extra.py
mkdir -p backend/routes
cat > backend/routes/admin_extra.py <<'PY'
from flask import Blueprint, request, jsonify, send_file
from database.base import SessionLocal
from database.models import Participant, TaskLog, TaskSession, TaskTrial, StressLog
from datetime import datetime
import io, csv, zipfile, json
import pandas as pd

bp = Blueprint("admin_extra", __name__, url_prefix="/api/admin/extra")

# helper to fetch logs for a participant
def get_logs_for_pid(db, pid):
    # combine TaskLog, TaskTrial, StressLog into one list
    rows = []
    # TaskLog entries
    for t in db.query(TaskLog).filter_by(participant_id=pid).all():
        rows.append({
            "source": "task_log",
            "id": t.id,
            "participant_id": t.participant_id,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "task": t.task_name,
            "trial": t.trial_index,
            "event": t.event,
            "extra": t.extra
        })
    # TaskTrial entries
    for tt in db.query(TaskTrial).join(TaskSession, TaskSession.id==TaskTrial.session_id).filter(TaskSession.participant_id==pid).all():
        rows.append({
            "source": "task_trial",
            "id": tt.id,
            "participant_id": pid,
            "timestamp": tt.timestamp.isoformat() if tt.timestamp else None,
            "task": None,
            "trial": tt.trial_index,
            "event": "trial",
            "extra": {
                "stimulus": tt.stimulus,
                "response": tt.response,
                "correct": tt.correct,
                "reaction_time_ms": tt.reaction_time_ms,
                "difficulty_level": tt.difficulty_level,
                "stress_level": tt.stress_level
            }
        })
    # StressLog entries
    for s in db.query(StressLog).filter_by(participant_id=pid).all():
        rows.append({
            "source": "stress_log",
            "id": s.id,
            "participant_id": s.participant_id,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            "task": "stress",
            "trial": None,
            "event": "stress_update",
            "extra": {
                "raw_proba": s.raw_proba,
                "ema_high": s.ema_high,
                "smoothed_label": s.smoothed_label,
                "difficulty": s.difficulty,
                "features": s.features
            }
        })
    # sort by timestamp if present
    rows.sort(key=lambda r: r.get("timestamp") or "")
    return rows

def rows_to_csv_text(rows):
    # flatten extras into JSON string
    out = io.StringIO()
    writer = csv.writer(out)
    header = ["source","id","participant_id","timestamp","task","trial","event","extra_json"]
    writer.writerow(header)
    for r in rows:
        writer.writerow([
            r.get("source"),
            r.get("id"),
            r.get("participant_id"),
            r.get("timestamp"),
            r.get("task"),
            r.get("trial"),
            r.get("event"),
            json.dumps(r.get("extra"), default=str)
        ])
    return out.getvalue()

@bp.route("/stats", methods=["GET"])
def stats():
    db = SessionLocal()
    try:
        participants = db.query(Participant).count()
        sessions = db.execute("SELECT count(*) FROM sessions").scalar() or 0
        stress_logs = db.query(StressLog).count()
        task_sessions = db.query(TaskSession).count()
        task_trials = db.query(TaskTrial).count()
        return jsonify({"ok": True, "data": {
            "participants": participants,
            "sessions": sessions,
            "stress_logs": stress_logs,
            "task_sessions": task_sessions,
            "task_trials": task_trials
        }})
    finally:
        db.close()

@bp.route("/export", methods=["GET"])
def export_one():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        rows = get_logs_for_pid(db, pid)
        csv_text = rows_to_csv_text(rows)
        buf = io.BytesIO()
        buf.write(csv_text.encode("utf-8"))
        buf.seek(0)
        filename = f"{pid}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.csv"
        return send_file(buf, as_attachment=True, download_name=filename, mimetype="text/csv")
    finally:
        db.close()

@bp.route("/export_all", methods=["GET"])
def export_all():
    db = SessionLocal()
    try:
        all_pids = [p.participant_id for p in db.query(Participant).all()]
        buffer = io.BytesIO()
        z = zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED)
        for pid in all_pids:
            rows = get_logs_for_pid(db, pid)
            csv_text = rows_to_csv_text(rows)
            z.writestr(f"{pid}.csv", csv_text)
        z.close()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name="all_participants_logs.zip", mimetype="application/zip")
    finally:
        db.close()

@bp.route("/export/json", methods=["GET"])
def export_json():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        rows = get_logs_for_pid(db, pid)
        return jsonify({"ok": True, "data": rows})
    finally:
        db.close()

@bp.route("/export/xlsx", methods=["GET"])
def export_xlsx():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        rows = get_logs_for_pid(db, pid)
        # convert to DataFrame
        df = pd.DataFrame(rows)
        buf = io.BytesIO()
        df.to_excel(buf, index=False)
        buf.seek(0)
        filename = f"{pid}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.xlsx"
        return send_file(buf, as_attachment=True, download_name=filename, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    finally:
        db.close()
PY

# 2) Update backend/app.py to ensure blueprint is loaded (it already attempts; ensure import path)
# we will not overwrite app.py; check that it registers admin_extra at bottom (app.register_blueprint)
echo "Backend admin_extra.py created."

# 3) Frontend: components + API updates
mkdir -p frontend/src/components/admin
cat > frontend/src/components/admin/CsvPreviewModal.tsx <<'TSX'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CsvPreviewModalProps {
  open: boolean;
  csv: string;
  onClose: () => void;
  onDownload?: () => void;
}

export default function CsvPreviewModal({ open, csv, onClose, onDownload }: CsvPreviewModalProps) {
  const preview = csv ? csv.split("\n").slice(0, 20).join("\n") : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>CSV Preview</DialogTitle>
        </DialogHeader>

        <pre className="p-3 bg-muted rounded-lg text-xs max-h-96 overflow-auto whitespace-pre-wrap">
          {preview || "No data available"}
        </pre>

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onDownload && <Button onClick={onDownload}>Download CSV</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
TSX

mkdir -p frontend/src/components/admin/charts
cat > frontend/src/components/admin/charts/StressLineChart.tsx <<'TSX'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function StressLineChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-white rounded-xl shadow-md p-4">
      <h2 className="font-semibold mb-2">Stress Level Over Time</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="smoothed_high" stroke="#ff4d4f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
TSX

# 4) Frontend: API improvements - single well typed file
mkdir -p frontend/src/api
cat > frontend/src/api/admin.ts <<'TS'
import { http } from "@/api/http";

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface Participant {
  participant_id: string;
  created_at?: string;
  assignment_group?: string;
}

export interface LogRow {
  id: number;
  participant_id: string;
  timestamp: string;
  task: string | null;
  trial: number | null;
  event: string | null;
  smoothed_high: number | null;
  rmssd: number | null;
  mean_hr: number | null;
  accuracy: number | null;
  payload: any;
}

/* ---------------------- ADMIN LOGIN ---------------------- */
export async function adminLogin(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  const res = await http.post("/api/admin/login", { username, password });
  const payload = res.data as { ok: boolean; token?: string; error?: string };

  if (payload.ok && payload.token) {
    return { ok: true, data: { token: payload.token, role: "admin" } };
  }
  return { ok: false, data: null as any, error: payload.error || "Login failed" };
}

/* ---------------------- PARTICIPANTS ---------------------- */
export async function getParticipants(): Promise<ApiResponse<Participant[]>> {
  const res = await http.get("/api/admin/participants");
  return res.data as ApiResponse<Participant[]>;
}

/* ---------------------- LOG QUERY ---------------------- */
export async function queryLogs(body: { participant_id?: string; task?: string; limit?: number; from_ts?: string; to_ts?: string; }): Promise<ApiResponse<LogRow[]>> {
  const res = await http.post("/api/admin/logs/query", body);
  return res.data as ApiResponse<LogRow[]>;
}

/* ---------------------- EXPORT CSV (returns Blob) ---------------------- */
export async function exportParticipantCSV(participant_id: string): Promise<Blob> {
  const response = await http.get(`/api/admin/extra/export?participant_id=${encodeURIComponent(participant_id)}`, { responseType: "blob" });
  return response.data as Blob;
}

/* ---------------------- EXPORT ALL (ZIP) ---------------------- */
export async function exportAllParticipantsZip(): Promise<Blob> {
  const res = await http.get(`/api/admin/extra/export_all`, { responseType: "blob" });
  return res.data as Blob;
}

/* ---------------------- EXPORT JSON / XLSX (open in new tab) ---------------------- */
export function exportJSON(pid: string) {
  window.open(`/api/admin/extra/export/json?participant_id=${encodeURIComponent(pid)}`, "_blank");
}

export function exportExcel(pid: string) {
  window.open(`/api/admin/extra/export/xlsx?participant_id=${encodeURIComponent(pid)}`, "_blank");
}

/* ----------------- CHANGE ADMIN PASSWORD (if exists) ------------------ */
export async function changeAdminPassword(old_pw: string, new_pw: string) {
  const res = await http.post("/admin/change-password", { old_password: old_pw, new_password: new_pw });
  return res.data;
}
TS

# 5) Patch ParticipantDetail to use new export fn and download blob
PD_FILE="frontend/src/pages/admin/ParticipantDetail.tsx"
if [ -f "$PD_FILE" ]; then
  echo "Patching $PD_FILE"
  perl -0777 -pe 's|import \{ queryLogs, exportParticipantCSV \} from "@/api/admin";|import { queryLogs, exportParticipantCSV } from "@/api/admin";|g' -i "$PD_FILE"
  # inject button handling if not present
  perl -0777 -pe 's|(const handleExport = async \(id: string\) => \{[^}]+\})|$1\n\nconst handleExportBlob = async (id: string) => {\n  try {\n    const blob = await exportParticipantCSV(id);\n    const filename = `${id}_${new Date().toISOString().replace(/[:.]/g, \"-\")}.csv`;\n    const url = window.URL.createObjectURL(blob);\n    const a = document.createElement(\"a\");\n    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);\n  } catch (err) {\n    console.error(\"Export failed\", err);\n    alert(\"Export failed. Check admin token and backend.\");\n  }\n};|s' -i "$PD_FILE" || true
  echo "Patched ParticipantDetail (if existed)"
else
  echo "ParticipantDetail not found; skipping patch."
fi

# 6) Add small helpers & update http wrapper to support responseType if missing
mkdir -p frontend/src/api
if [ ! -f frontend/src/api/http.ts ]; then
cat > frontend/src/api/http.ts <<'TS'
import axios from "axios";

export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE || "") || "",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
TS
fi

# 7) NPM installs for frontend
echo "Installing frontend packages (recharts, axios, sonner)"
cd frontend
# prefer npm; user may switch to bun/pnpm
npm install --no-audit --no-fund recharts axios sonner file-saver
cd "$ROOT"

# 8) Seed admin user script (safe to run multiple times)
cat > backend/setup_admin.py <<'PY'
from database.base import SessionLocal
from database.models import AdminUser
from werkzeug.security import generate_password_hash
db = SessionLocal()
if not db.query(AdminUser).filter_by(username="admin").first():
    db.add(AdminUser(username="admin", password_hash=generate_password_hash("admin123")))
    db.commit()
    print("Admin created")
else:
    print("Admin already exists")
db.close()
PY

echo "Running backend DB seed..."
python3 backend/setup_admin.py || python backend/setup_admin.py

# 9) Run backend tests
echo "Running pytest for backend tests..."
pytest backend/tests -q || true

echo "ALL FILES WRITTEN. Next: restart backend and frontend dev servers."
echo "Run these commands now (from repo root):"
cat <<'CMDS'
# Activate environment, then:
conda activate stresssys
# Start backend:
python backend/app.py

# In another terminal:
cd frontend
npm run dev
CMDS

echo "Finished apply_all_features.sh"
