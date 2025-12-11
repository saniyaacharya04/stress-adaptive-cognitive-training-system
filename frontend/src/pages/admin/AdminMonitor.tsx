import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function AdminMonitor() {
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:5000");

    socket.on("connect", () => console.log("Admin monitor connected"));

    socket.on("task_event", (data) => {
      setLastEvent(data);
    });

    // Proper cleanup — MUST return void
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Live Monitoring</h1>

      <div className="glass-card p-4">
        {lastEvent ? (
          <>
            <p>Participant: {lastEvent.participant_id}</p>
            <pre className="text-xs">{JSON.stringify(lastEvent, null, 2)}</pre>
          </>
        ) : (
          <p>No events yet</p>
        )}
      </div>
    </div>
  );
}
