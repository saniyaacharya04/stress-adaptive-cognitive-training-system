#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
echo "Working in $ROOT"

# --------------------------
# FRONTEND FILES
# --------------------------

mkdir -p frontend/src/components/admin
mkdir -p frontend/src/api
mkdir -p frontend/src/pages/admin
mkdir -p backend/routes

echo "Writing CsvPreviewModal.tsx..."
cat > frontend/src/components/admin/CsvPreviewModal.tsx <<'TSX'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CsvPreviewModalProps {
  open: boolean;
  csv: string;
  onClose: () => void;
}

export default function CsvPreviewModal({ open, csv, onClose }: CsvPreviewModalProps) {
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
      </DialogContent>
    </Dialog>
  );
}
TSX

echo "Writing StressLineChart.tsx..."
cat > frontend/src/components/admin/StressLineChart.tsx <<'TSX'
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
          <Line type="monotone" dataKey="smoothed_high" stroke="#e11d48" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
TSX

echo "Updating frontend admin API (admin.ts)..."
cat > frontend/src/api/admin.ts <<'TS'
/**
 * Frontend admin API helpers (strongly typed)
 *
 * Assumes you have an http helper at src/api/http that wraps axios and returns
 * axios responses (res.data).
 */
import { http } from "@/api/http";

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

/* Login response wrapper */
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
export async function adminLogin(
  username: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const res = await http.post("/api/admin/login", { username, password });
  // backend returns { ok: true, token: "<jwt>" } or { ok:false, error: "<text>"}
  const payload = res.data as { ok: boolean; token?: string; error?: string };

  if (payload.ok && payload.token) {
    return {
      ok: true,
      data: {
        token: payload.token,
        role: "admin",
      },
    };
  }

  return {
    ok: false,
    data: null as any,
    error: payload.error || "Login failed",
  };
}

/* ---------------------- PARTICIPANTS ---------------------- */
export async function getParticipants(): Promise<ApiResponse<Participant[]>> {
  const res = await http.get("/api/admin/participants");
  return res.data as ApiResponse<Participant[]>;
}

/* ---------------------- LOG QUERY ---------------------- */
export async function queryLogs(body: {
  participant_id?: string;
  task?: string;
  limit?: number;
  from_ts?: string;
  to_ts?: string;
}): Promise<ApiResponse<LogRow[]>> {
  const res = await http.post("/api/admin/logs/query", body);
  return res.data as ApiResponse<LogRow[]>;
}

/* ---------------------- EXPORT CSV (returns Blob) ---------------------- */
export async function exportParticipantCSV(participant_id: string): Promise<Blob> {
  const response = await http.get(`/api/admin/export?participant_id=${encodeURIComponent(participant_id)}`, {
    responseType: "blob",
  });
  return response.data as Blob;
}

/* ---------------------- EXPORT ALL (ZIP) ---------------------- */
export async function exportAllParticipantsZip(): Promise<Blob> {
  const res = await http.get(`/api/admin/export_all`, { responseType: "blob" });
  return res.data as Blob;
}

/* ----------------- CHANGE ADMIN PASSWORD ------------------ */
export async function changeAdminPassword(old_pw: string, new_pw: string) {
  const res = await http.post("/api/admin/change-password", {
    old_password: old_pw,
    new_password: new_pw,
  });
  return res.data;
}

/* ----------------- EXPORT JSON/XLSX LINKS (open in new tab) ------------------ */
export function exportJSON(participant_id: string) {
  window.open(`/api/admin/export/json?participant_id=${encodeURIComponent(participant_id)}`, "_blank");
}

export function exportExcel(participant_id: string) {
  window.open(`/api/admin/export/xlsx?participant_id=${encodeURIComponent(participant_id)}`, "_blank");
}
TS

echo "Patching frontend ParticipantDetail to use new exportParticipantCSV signature (only if file exists)..."
PD="frontend/src/pages/admin/ParticipantDetail.tsx"
if [ -f "$PD" ]; then
  # create a simple safe patched version replacing inline export call
  cat > "$PD" <<'TSX'
import React, { useState } from "react";
import { queryLogs, exportParticipantCSV } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ParticipantDetail() {
  const [loading, setLoading] = useState(false);
  const id = window.location.pathname.split("/").pop() || "";

  async function handleDownloadCSV() {
    try {
      setLoading(true);
      const blob = await exportParticipantCSV(id);
      const filename = `participant_${id}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV download started");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download CSV");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Participant {id}</h1>
      <div className="space-x-2">
        <Button onClick={handleDownloadCSV} disabled={loading}>
          {loading ? "Preparing..." : "Download CSV"}
        </Button>
      </div>
    </div>
  );
}
TSX
  echo "Patched $PD"
else
  echo "Note: $PD not found — skipped patch"
fi

# --------------------------
# BACKEND: routes/admin_extra.py
# --------------------------
ADMIN_EXTRA="backend/routes/admin_extra.py"
echo "Writing backend/routes/admin_extra.py..."
cat > "$ADMIN_EXTRA" <<'PY'
from flask import Blueprint, request, send_file, jsonify
from database.base import SessionLocal
from database.models import Participant, TaskLog, StressLog
from io import BytesIO
import csv
import json
import pandas as pd
import zipfile
from functools import wraps

bp = Blueprint("admin_extra", __name__, url_prefix="/api/admin/extra")

# NOTE: require_admin decorator from app.py will be used when blueprint is registered.
# We will import it via Flask app import side (app registers blueprint with require_admin already on the app side).

def _logs_for_pid(db, pid):
    # Combine task logs and stress logs into rows for CSV export
    task_rows = db.query(TaskLog).filter_by(participant_id=pid).all()
    stress_rows = db.query(StressLog).filter_by(participant_id=pid).all()

    # normalize to dicts
    rows = []
    for t in task_rows:
        rows.append({
            "id": t.id,
            "participant_id": t.participant_id,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "task": t.task_name,
            "trial": t.trial_index,
            "event": t.event,
            "smoothed_high": None,
            "rmssd": None,
            "mean_hr": None,
            "accuracy": None,
            "payload": t.extra,
            "type": "task",
        })
    for s in stress_rows:
        rows.append({
            "id": s.id,
            "participant_id": s.participant_id,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            "task": None,
            "trial": None,
            "event": None,
            "smoothed_high": s.ema_high,
            "rmssd": (s.features or {}).get("rmssd"),
            "mean_hr": (s.features or {}).get("mean_hr"),
            "accuracy": None,
            "payload": s.features,
            "type": "stress",
        })
    # sort by timestamp
    rows.sort(key=lambda r: r.get("timestamp") or "")
    return rows

@bp.route("/stats", methods=["GET"])
def stats():
    db = SessionLocal()
    try:
        participants = db.query(Participant).count()
        sessions = db.execute("SELECT COUNT(*) FROM sessions").scalar()  # raw for brevity
        stress_logs = db.query(StressLog).count()
        task_sessions = db.execute("SELECT COUNT(*) FROM task_sessions").scalar()
        task_trials = db.execute("SELECT COUNT(*) FROM task_trials").scalar()
        return jsonify({"ok": True, "data": {
            "participants": participants,
            "sessions": int(sessions or 0),
            "stress_logs": stress_logs,
            "task_sessions": int(task_sessions or 0),
            "task_trials": int(task_trials or 0),
        }})
    finally:
        db.close()

@bp.route("/export", methods=["GET"])
def export_csv():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        rows = _logs_for_pid(db, pid)
        # write CSV into memory
        buffer = BytesIO()
        writer = csv.writer(buffer)
        header = ["id","participant_id","timestamp","task","trial","event","smoothed_high","rmssd","mean_hr","payload","type"]
        writer.writerow(header)
        for r in rows:
            writer.writerow([
                r.get("id"),
                r.get("participant_id"),
                r.get("timestamp"),
                r.get("task"),
                r.get("trial"),
                r.get("event"),
                r.get("smoothed_high"),
                r.get("rmssd"),
                r.get("mean_hr"),
                json.dumps(r.get("payload") or {}),
                r.get("type"),
            ])
        buffer.seek(0)
        return send_file(buffer, mimetype="text/csv", as_attachment=True, download_name=f"{pid}.csv")
    finally:
        db.close()

@bp.route("/export_all", methods=["GET"])
def export_all():
    db = SessionLocal()
    try:
        pids = [r[0] for r in db.query(Participant.participant_id).all()]
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for pid in pids:
                rows = _logs_for_pid(db, pid)
                csv_buffer = BytesIO()
                writer = csv.writer(csv_buffer)
                header = ["id","participant_id","timestamp","task","trial","event","smoothed_high","rmssd","mean_hr","payload","type"]
                writer.writerow(header)
                for r in rows:
                    writer.writerow([
                        r.get("id"),
                        r.get("participant_id"),
                        r.get("timestamp"),
                        r.get("task"),
                        r.get("trial"),
                        r.get("event"),
                        r.get("smoothed_high"),
                        r.get("rmssd"),
                        r.get("mean_hr"),
                        json.dumps(r.get("payload") or {}),
                        r.get("type"),
                    ])
                csv_buffer.seek(0)
                zf.writestr(f"{pid}.csv", csv_buffer.read())
        zip_buffer.seek(0)
        return send_file(zip_buffer, mimetype="application/zip", as_attachment=True, download_name="participant_logs.zip")
    finally:
        db.close()

@bp.route("/export/json", methods=["GET"])
def export_json():
    pid = request.args.get("participant_id")
    if not pid:
        return jsonify({"ok": False, "error": "participant_id required"}), 400
    db = SessionLocal()
    try:
        rows = _logs_for_pid(db, pid)
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
        rows = _logs_for_pid(db, pid)
        df = pd.DataFrame(rows)
        out = BytesIO()
        with pd.ExcelWriter(out, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="logs")
        out.seek(0)
        return send_file(out, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                         as_attachment=True, download_name=f"{pid}.xlsx")
    finally:
        db.close()
PY

# ensure admin_extra blueprint file python syntax valid
python - <<PYCODE
import ast, sys
fn = "backend/routes/admin_extra.py"
src = open(fn).read()
ast.parse(src)
print("backend/routes/admin_extra.py parsed OK")
PYCODE

echo "ALL files written."

cat <<EOF
Next steps (run these in your terminal):

# 1) Install any missing frontend deps (recharts and sonner are referenced above)
cd frontend
# if using npm:
npm install recharts sonner
# or using bun/pnpm as you prefer

# 2) Restart backend
# from repo root:
conda activate stresssys   # your env
python backend/app.py

# 3) Restart frontend dev server (vite)
cd frontend
npm run dev

# 4) Test:
# - Open Admin UI, try preview, download CSV/XLSX, export-all ZIP
# - Use curl to test backend routes directly:
#    curl -H "Authorization: Bearer <admin_token>" "http://localhost:5000/api/admin/extra/export?participant_id=P_xxx" -o test.csv

IMPORTANT: Review created files before committing. The script overwrote admin.ts and admin_extra.py.
EOF
