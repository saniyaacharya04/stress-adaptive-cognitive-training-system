// frontend/src/pages/admin/AdminDashboard.tsx
import { logout } from "../../utils/auth";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import io from "socket.io-client";

import {
  getParticipants,
  queryLogs,
  exportAllParticipantsZip,
  exportParticipantCSV,
  exportJSON,
  exportExcel,
} from "@/api/admin";

interface ParticipantOpt {
  participant_id: string;
  assignment_group?: string;
  created_at?: string;
}

interface LogRow {
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

const socket = io(); // uses same origin; if backend runs on other port, use URL

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<ParticipantOpt[]>([]);
  const [selectedPid, setSelectedPid] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("admin_dark") === "1");

  useEffect(() => {
    localStorage.setItem("admin_dark", dark ? "1" : "0");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    async function load() {
      try {
        const res = await getParticipants();
        if (res.ok) {
          setParticipants(res.data);
          if (res.data.length > 0 && !selectedPid) setSelectedPid(res.data[0].participant_id);
        } else {
          console.error("Failed load participants", res.error);
        }
      } catch (err) {
        console.error("Participant fetch error", err);
      }
    }
    load();
  }, []);

  // Real-time updates: when stress updates come from backend, refresh logs for selected pid
  useEffect(() => {
    socket.on("connect", () => {});
    socket.on("admin_update", (payload: any) => {
      // simple heuristic: if payload includes participant_id equal selectedPid -> refresh
      if (payload?.participant_id && payload.participant_id === selectedPid) {
        handleApplyFilter();
      }
    });
    return () => {
    <button onClick={logout}>Logout</button>
      socket.off("admin_update");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPid]);

  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      const body: any = {
        participant_id: selectedPid || undefined,
        task: taskFilter || undefined,
        from_ts: fromDate || undefined,
        to_ts: toDate || undefined,
        limit: 1000,
      };
      const res = await queryLogs(body);
      if (res.ok) {
        setLogs(res.data);
      } else {
        alert("Failed to query logs: " + (res.error || "unknown"));
      }
    } catch (err) {
      console.error("Query Logs error", err);
      alert("Failed to query logs. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = logs.length;
    const avgStress = total ? logs.reduce((s, r) => s + (r.smoothed_high || 0), 0) / total : 0;
    const accuracy = total ? logs.filter((r) => typeof r.accuracy === "number").reduce((s, r) => s + (r.accuracy || 0), 0) / Math.max(1, logs.filter((r) => typeof r.accuracy === "number").length) : null;
    return { total, avgStress, accuracy };
  }, [logs]);

  const chartData = useMemo(() => {
    return logs
      .map((r) => ({
        timestamp: r.timestamp ? format(new Date(r.timestamp), "HH:mm:ss") : "",
        smoothed_high: r.smoothed_high ?? 0,
        accuracy: r.accuracy ?? 0,
      }))
      .slice(-200);
  }, [logs]);

  const handleDownloadAll = async () => {
    setExporting(true);
    try {
      const blob = await exportAllParticipantsZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all_participants_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export all failed", err);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedPid) return alert("Select a participant first");
    try {
      const blob = await exportParticipantCSV(selectedPid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedPid}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed", err);
      alert("CSV export failed");
    }
  };

  return (<>
    <button onClick={logout}>Logout</button>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setDark((d) => !d)}>
            {dark ? "Light" : "Dark"}
          </Button>
          <Button onClick={handleDownloadAll} disabled={exporting}>
            {exporting ? "Exporting..." : "Export ALL (ZIP)"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm">Participant</label>
          <Select onValueChange={(v) => setSelectedPid(v)} value={selectedPid}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select participant" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.participant_id} value={p.participant_id}>
                  {p.participant_id} {p.assignment_group ? `(${p.assignment_group})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Task filter</label>
          <Input value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} placeholder="task name e.g. nback" />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Date range (optional)</label>
          <div className="flex gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleApplyFilter} disabled={loading}>
          {loading ? "Loading..." : "Apply"}
        </Button>
        <Button variant="outline" onClick={() => { setLogs([]); setTaskFilter(""); setFromDate(""); setToDate(""); }}>
          Reset
        </Button>
        <div />
        <div className="ml-auto flex gap-2">
          <Button onClick={handleExportCSV} disabled={!selectedPid}>Export CSV</Button>
          <Button onClick={() => exportJSON(selectedPid)} disabled={!selectedPid}>Export JSON</Button>
          <Button onClick={() => exportExcel(selectedPid)} disabled={!selectedPid}>Export Excel</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Total Logs</div>
          <div className="text-2xl font-bold">{summary.total}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Avg Stress</div>
          <div className="text-2xl font-bold">{(summary.avgStress ?? 0).toFixed(3)}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="text-sm text-muted-foreground">Avg Accuracy</div>
          <div className="text-2xl font-bold">
            {summary.accuracy == null ? "N/A" : `${(summary.accuracy * 100).toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
          <h3 className="font-semibold mb-2">Stress over time</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="smoothed_high" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
          <h3 className="font-semibold mb-2">Accuracy (last logs)</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Log table preview (simple) */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Logs (preview)</h3>
        <div className="overflow-auto max-h-72">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">ts</th>
                <th className="p-2">task</th>
                <th className="p-2">trial</th>
                <th className="p-2">smoothed</th>
                <th className="p-2">accuracy</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 200).map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</td>
                  <td className="p-2">{r.task ?? "-"}</td>
                  <td className="p-2">{r.trial ?? "-"}</td>
                  <td className="p-2">{(r.smoothed_high ?? 0).toFixed(3)}</td>
                  <td className="p-2">{r.accuracy == null ? "-" : `${(r.accuracy * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
</>
  );
}
