import { useEffect, useState } from "react";
import { queryLogs } from "@/api/admin";

export default function LogBrowser() {
  const [pid, setPid] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const res = await queryLogs({ participant_id: pid || undefined, limit: 500 });
      if (res?.ok) setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">Log Browser</h1>

      <div className="flex gap-2 mb-4">
        <input value={pid} onChange={e => setPid(e.target.value)} placeholder="Participant ID (optional)" className="input" />
        <button className="btn" onClick={fetch} disabled={loading}>{loading ? "Loading..." : "Query"}</button>
      </div>

      <div className="space-y-3">
        {logs.map(l => (
          <div key={l.id} className="glass-card p-3">
            <div className="text-xs text-muted-foreground">{l.timestamp} • {l.task}</div>
            <div className="font-mono">{l.participant_id}</div>
            <pre className="text-xs mt-2">{JSON.stringify(l.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
