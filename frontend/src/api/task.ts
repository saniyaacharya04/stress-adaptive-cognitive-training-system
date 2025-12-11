import { http } from "./http";

export interface StartTaskResponse {
  ok: boolean;
  session_id: number;
}

export interface EventResponse {
  ok: boolean;
}

export interface FinishTaskResponse {
  ok: boolean;
}

export interface SummaryResponse {
  ok: boolean;
  summary: any;
}

export async function startTaskSession(token: string, task: string, config: any = {}): Promise<StartTaskResponse> {
  const res = await http.post(
    "/api/task/start",
    { task, config },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data as StartTaskResponse;
}

export async function sendTaskEvent(token: string, payload: any): Promise<EventResponse> {
  const res = await http.post(
    "/api/task/event",
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data as EventResponse;
}

export async function finishTaskSession(token: string, session_id: number): Promise<FinishTaskResponse> {
  const res = await http.post(
    "/api/task/finish",
    { session_id },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data as FinishTaskResponse;
}

export async function getTaskSummary(session_id: number): Promise<any> {
  const res = await http.get(`/api/task/summary/${session_id}`);
  return (res.data as SummaryResponse).summary;
}
