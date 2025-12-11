import { useEffect } from "react";
import useSocket from "./useSocket";

export default function useJoinRoom(participantId?: string) {
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !participantId) return;
    socket.emit("join_participant_room", { participant_id: participantId });
    return () => {
      socket.emit("leave_participant_room", { participant_id: participantId });
    };
  }, [socket, participantId]);
}
