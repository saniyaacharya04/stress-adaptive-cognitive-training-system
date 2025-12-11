import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export default function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (_socket) {
      setSocket(_socket);
      return;
    }
    const s = io((import.meta.env.VITE_API_URL || "http://localhost:5000"), { transports: ["websocket", "polling"] });
    _socket = s;
    setSocket(s);

    s.on("connect", () => console.log("socket connected", s.id));
    s.on("disconnect", () => console.log("socket disconnected"));

    return () => {
      // do not fully disconnect singleton to preserve admin monitor across pages,
      // but remove listeners to avoid duplicates
      s.removeAllListeners();
      // optional: s.disconnect();
      _socket = null;
      setSocket(null);
    };
  }, []);

  return socket;
}
