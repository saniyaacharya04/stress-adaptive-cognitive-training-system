import { useEffect, useState } from "react";
import useSocket from "@/hooks/useSocket";

export default function MonitoringRoom() {
  const socket = useSocket();
  const [events, setEvents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    const genericHandler = (data:any) => {
      setEvents(prev => [data, ...prev].slice(0,200));
    };

    socket.on("task_event", genericHandler);
    socket.on("stress_update", genericHandler);
    socket.on("face_update", genericHandler);

    return () => {
      socket.off("task_event", genericHandler);
      socket.off("stress_update", genericHandler);
      socket.off("face_update", genericHandler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    if (!selected) {
      socket.emit("leave_participant_room", { participant_id: selected });
      return;
    }
    socket.emit("join_participant_room", { participant_id: selected });
  }, [selected, socket]);

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">Real-time Monitoring Room</h1>

      <div className="mb-4">
        <label className="text-sm">Participant ID</label>
        <input className="input mt-1" value={selected} onChange={(e)=>setSelected(e.target.value)} placeholder="P_xxx or leave blank for global"/>
        <div className="text-xs text-muted-foreground mt-2">Enter a participant id and click anywhere — server will stream participant-specific events.</div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-auto">
        {events.length === 0 && <p>No events yet</p>}
        {events.map((e, i) => (
          <div key={i} className="border rounded p-2 text-xs">
            <div className="text-muted-foreground">{e.timestamp || new Date().toISOString()}</div>
            <div>{e.type || e.event} — {e.participant_id || e.participant}</div>
            <pre className="text-[11px] mt-1">{JSON.stringify(e, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
