import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

/**
 * useSocket hook
 * - Creates a global singleton socket
 * - Joins participant room if participantId is provided
 */
export default function useSocket(participantId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Reuse existing socket
    if (_socket) {
      setSocket(_socket);

      if (participantId) {
        _socket.emit("join_participant_room", { participant_id: participantId });
      }

      return;
    }

    // Create new socket connection
    const s = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    _socket = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("socket connected", s.id);

      if (participantId) {
        s.emit("join_participant_room", { participant_id: participantId });
      }
    });

    s.on("disconnect", () => console.log("socket disconnected"));

    return () => {
      s.removeAllListeners();
      _socket = null;
      setSocket(null);
    };
  }, [participantId]);

  return socket;
}
