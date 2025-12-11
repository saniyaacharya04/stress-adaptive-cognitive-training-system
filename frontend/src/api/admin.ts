// frontend/src/api/admin.ts
import { http } from "./http";

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface Participant {
  participant_id: string;
  created_at: string;
  assignment_group: string;
}

export interface LogRow {
  id: number;
  participant_id: string;
  timestamp: string;
  task: string | null;
  trial: number | null;
  event: string | null;
  smoothed_high: number | null;
  rmssd: number | null;
  mean_hr: number | null;
  accuracy: number | null;
  payload: any;
}

/* ---------------------- ADMIN LOGIN ---------------------- */
export async function adminLogin(
  username: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const res = await http.post("/api/admin/login", { username, password });
  return res.data as ApiResponse<LoginResponse>;
}

/* ---------------------- PARTICIPANTS ---------------------- */
export async function getParticipants(): Promise<
  ApiResponse<Participant[]>
> {
  const res = await http.get("/api/admin/participants");
  return res.data as ApiResponse<Participant[]>;
}

/* ---------------------- LOG QUERY ---------------------- */
export async function queryLogs(body: {
  participant_id?: string;
  task?: string;
  limit?: number;
  from_ts?: string;
  to_ts?: string;
}): Promise<ApiResponse<LogRow[]>> {
  const res = await http.post("/api/admin/logs/query", body);
  return res.data as ApiResponse<LogRow[]>;
}

/* ---------------------- EXPORT LOGS ---------------------- */
export function exportLogs(participant_id: string) {
  window.open(
    `/api/admin/export?participant_id=${encodeURIComponent(participant_id)}`,
    "_blank"
  );
}
/* ---------------------- CHANGE ADMIN PASSWORD ---------------------- */
export async function changeAdminPassword(old_pw: string, new_pw: string) {
  const res = await http.post("/admin/change-password", {
    old_password: old_pw,
    new_password: new_pw,
  });
  return res.data;
}

/* ---------------------- EXPORT PARTICIPANT CSV ---------------------- */
export function exportParticipantCSV(participant_id: string) {
  window.open(
    `/api/admin/export?participant_id=${encodeURIComponent(participant_id)}`,
    "_blank"
  );
}
