import { useEffect, useState } from "react";
import { queryLogs } from "@/api/admin";

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await queryLogs({ limit: 200 }); // valid signature
      if (res.ok) {
        setLogs(res.data);
      }
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Log Browser</h1>

      {loading && <p>Loading...</p>}

      {!loading &&
        logs.map((log) => (
          <div key={log.id} className="border p-3 rounded mb-2 text-sm">
            <p><b>{log.timestamp}</b></p>
            <p>Participant: {log.participant_id}</p>
            <p>Task: {log.task}</p>
            <p>Event: {log.event}</p>
          </div>
        ))}
    </div>
  );
}
