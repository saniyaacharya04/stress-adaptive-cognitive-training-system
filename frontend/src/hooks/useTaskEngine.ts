import { useState } from "react";
import useSocket from "./useSocket";
import {
  startTaskSession,
  sendTaskEvent,
  finishTaskSession,
} from "../api/task";

/**
 * Task engine hook for tasks (NBack, Stroop, Reaction)
 */
export default function useTaskEngine(token: string, participantId: string) {
  const socket = useSocket(participantId); // correct import & usage

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);

  // Start task session
  async function start(taskName: string, config: any = {}) {
    const res = await startTaskSession(token, taskName, config);
    setSessionId(res.session_id);
    setTrialIndex(0);
    return res.session_id;
  }

  // Send trial event
  async function sendTrial(data: any) {
    if (!sessionId) return;

    const payload = {
      session_id: sessionId,
      trial_index: trialIndex + 1,
      ...data,
    };

    await sendTaskEvent(token, payload);
    setTrialIndex((i) => i + 1);
  }

  // Finish task session
  async function finish() {
    if (!sessionId) return;
    await finishTaskSession(token, sessionId);
  }

  return {
    socket,
    sessionId,
    trialIndex,
    start,
    sendTrial,
    finish,
  };
}
