#!/bin/bash
set -e

ROOT=$(pwd)
FRONTEND="$ROOT/frontend/src/pages/admin"
COMPONENTS="$ROOT/frontend/src/components/admin"

echo "Applying Admin UI Enhancements..."
echo "Location: $ROOT"

########################################
# 1) Ensure components directory exists
########################################
mkdir -p "$COMPONENTS"

########################################
# 2) Write CsvPreviewModal.tsx
########################################
cat <<'EOF' > "$COMPONENTS/CsvPreviewModal.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CsvPreviewModalProps {
  open: boolean;
  csv: string;
  onClose: () => void;
}

export default function CsvPreviewModal({ open, csv, onClose }: CsvPreviewModalProps) {
  const preview = csv.split("\n").slice(0, 30).join("\n");

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
EOF

echo "✔ CsvPreviewModal.tsx written"


########################################
# 3) Write StressLineChart.tsx
########################################
cat <<'EOF' > "$COMPONENTS/StressLineChart.tsx"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function StressLineChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-white rounded-xl shadow-md p-4">
      <h2 className="font-semibold mb-2">Stress Trend</h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="smoothed_high" stroke="#ff0033" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
EOF

echo "✔ StressLineChart.tsx written"


########################################
# 4) Patch ParticipantDetail.tsx
########################################
TARGET="$FRONTEND/ParticipantDetail.tsx"

if [[ -f "$TARGET" ]]; then
echo "Patching ParticipantDetail.tsx..."

cat <<'EOF' > "$TARGET"
import { useEffect, useState } from "react";
import { queryLogs, exportParticipantCSV, exportJSON, exportExcel, exportAllParticipants } from "@/api/admin";
import { Button } from "@/components/ui/button";
import CsvPreviewModal from "@/components/admin/CsvPreviewModal";
import StressLineChart from "@/components/admin/StressLineChart";
import { useParams } from "react-router-dom";

export default function ParticipantDetail() {
  const { id } = useParams();

  const [logs, setLogs] = useState<any[]>([]);
  const [csvModal, setCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  const loadLogs = async () => {
    if (!id) return;
    const res = await queryLogs({ participant_id: id });
    if (res.ok) setLogs(res.data);
  };

  useEffect(() => {
    loadLogs();
  }, [id]);

  const handlePreview = async () => {
    const blob = await exportParticipantCSV(id!);
    const text = await blob.text();
    setCsvText(text);
    setCsvModal(true);
  };

  const handleDownloadCSV = async () => {
    const blob = await exportParticipantCSV(id!);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 p-6">

      <h1 className="text-xl font-bold">Participant {id}</h1>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handlePreview}>Preview CSV</Button>
        <Button variant="outline" onClick={handleDownloadCSV}>Download CSV</Button>
        <Button variant="outline" onClick={() => exportJSON(id!)}>Download JSON</Button>
        <Button variant="outline" onClick={() => exportExcel(id!)}>Download XLSX</Button>
        <Button variant="destructive" onClick={exportAllParticipants}>Export ALL (ZIP)</Button>
      </div>

      {/* Charts */}
      <StressLineChart data={logs} />

      {/* CSV Modal */}
      <CsvPreviewModal open={csvModal} csv={csvText} onClose={() => setCsvModal(false)} />
    </div>
  );
}
EOF

echo "✔ ParticipantDetail.tsx updated"
else
echo "⚠ Skipping ParticipantDetail.tsx (file not found)"
fi


########################################
# 5) Patch AdminLogs.tsx
########################################
TARGET2="$FRONTEND/AdminLogs.tsx"

if [[ -f "$TARGET2" ]]; then
echo "Patching AdminLogs.tsx..."

cat <<'EOF' > "$TARGET2"
import { useState } from "react";
import { queryLogs } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ pid: "", task: "" });

  const applyFilter = async () => {
    const res = await queryLogs({
      participant_id: filter.pid || undefined,
      task: filter.task || undefined,
    });

    if (res.ok) setLogs(res.data);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Log Explorer</h1>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Participant ID"
          value={filter.pid}
          onChange={(e) => setFilter({ ...filter, pid: e.target.value })}
        />

        <select
          className="border rounded px-2"
          value={filter.task}
          onChange={(e) => setFilter({ ...filter, task: e.target.value })}
        >
          <option value="">All Tasks</option>
          <option value="nback">N-Back</option>
          <option value="stroop">Stroop</option>
          <option value="gonogo">Go/No-Go</option>
        </select>

        <Button onClick={applyFilter}>Apply</Button>
      </div>

      <pre className="p-4 bg-muted rounded-xl max-h-[500px] overflow-auto text-xs">
        {JSON.stringify(logs, null, 2)}
      </pre>
    </div>
  );
}
EOF

echo "✔ AdminLogs.tsx updated"
else
echo "⚠ Skipping AdminLogs.tsx (file not found)"
fi


########################################
# 6) Patch AdminDashboard.tsx
########################################
TARGET3="$FRONTEND/AdminDashboard.tsx"

if [[ -f "$TARGET3" ]]; then
echo "Patching AdminDashboard.tsx..."

cat <<'EOF' > "$TARGET3"
import { Button } from "@/components/ui/button";
import { exportAllParticipants } from "@/api/admin";

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>

      <Button onClick={exportAllParticipants}>Export ALL Participants (ZIP)</Button>

      <p className="text-muted-foreground text-sm mt-4">
        Use the sidebar to navigate participant logs, charts, and filters.
      </p>
    </div>
  );
}
EOF

echo "✔ AdminDashboard.tsx updated"
else
echo "⚠ Skipping AdminDashboard.tsx (file not found)"
fi


echo ""
echo "🎉 ALL Admin UI enhancements applied!"
echo "➡ Restart frontend: cd frontend && npm run dev"
echo "➡ Restart backend: python backend/app.py"
