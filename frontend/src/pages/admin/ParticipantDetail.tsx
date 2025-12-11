import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { queryLogs, exportParticipantCSV } from "@/api/admin";

export default function ParticipantDetail() {
  const { id } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const res = await queryLogs({ participant_id: id, limit: 500 });
        if (res?.ok) setLogs(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const exportCSV = async () => {
    if (!id) return;
    try {
      const blob = await exportParticipantCSV(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}_logs.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Participant: {id}</h1>
        <div>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {loading && <p>Loading logs...</p>}

      <div className="space-y-3">
        {logs.map(l => (
          <div key={l.id} className="glass-card p-3">
            <div className="text-sm text-muted-foreground">{l.timestamp}</div>
            <div className="font-mono">{l.task} — {l.event}</div>
            <pre className="text-xs mt-2">{JSON.stringify(l.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
