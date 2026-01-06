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
