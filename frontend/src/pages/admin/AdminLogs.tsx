// frontend/src/pages/admin/AdminLogs.tsx
import { useState } from "react";
import { queryLogs } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogs() {
  const [pid, setPid] = useState("");
  const [logs, setLogs] = useState([]);

  const load = async () => {
    const res = await queryLogs({
      participant_id: pid,
      limit: 100,
    });

    if (res.ok) {
      setLogs(res.data || []);
    } else {
      console.error("Log query failed", res.error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Admin Logs</h1>

      <div className="flex items-center gap-3 mb-4">
        <Input
          placeholder="Participant ID"
          value={pid}
          onChange={(e) => setPid(e.target.value)}
        />
        <Button onClick={load}>Load Logs</Button>
      </div>

      <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto h-[400px]">
        {JSON.stringify(logs, null, 2)}
      </pre>
    </div>
  );
}
