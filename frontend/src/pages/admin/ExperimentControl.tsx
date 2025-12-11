import { useState } from "react";
import { experimentControl } from "@/api/admin";

export default function ExperimentControl() {
  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);

  const doAction = async (act: "start"|"pause"|"stop") => {
    setLoading(true);
    try {
      const res = await experimentControl(act);
      if (res?.ok) setStatus(res.data.status || act);
    } catch (e) {
      console.error(e);
      alert("Experiment action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">Experiment Control</h1>

      <div className="flex gap-3">
        <button className="btn" onClick={() => doAction("start")} disabled={loading}>Start</button>
        <button className="btn" onClick={() => doAction("pause")} disabled={loading}>Pause</button>
        <button className="btn destructive" onClick={() => doAction("stop")} disabled={loading}>Stop</button>
      </div>

      <div className="mt-4">
        <p>Status: <span className="font-mono">{status}</span></p>
      </div>
    </div>
  );
}
