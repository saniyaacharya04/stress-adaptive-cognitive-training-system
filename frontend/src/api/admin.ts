import { http } from "@/api/http";

/* -------------------- TYPES -------------------- */

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface Participant {
  participant_id: string;
  created_at?: string;
  assignment_group?: string;
}

export interface LogRow {
  id?: number;
  participant_id?: string;
  timestamp?: string;
  task?: string | null;
  trial?: number | null;
  event?: string | null;
  payload?: any;
}

/* -------------------- AUTH -------------------- */

export async function adminLogin(
  username: string,
  password: string
): Promise<ApiResponse<{ token: string }>> {
  const res = await http.post("/api/admin/login", { username, password });
  return res.data;
}

/* -------------------- PARTICIPANTS -------------------- */

export async function getParticipants(): Promise<ApiResponse<Participant[]>> {
  const res = await http.get("/api/admin/participants");
  return res.data;
}

/* -------------------- LOG QUERY (STUB) -------------------- */

export async function queryLogs(_: any): Promise<ApiResponse<LogRow[]>> {
  return { ok: true, data: [] };
}

/* -------------------- EXPORTS -------------------- */

export async function exportParticipantCSV(
  participant_id: string
): Promise<Blob> {
  const res = await http.get(
    `/api/admin/export?participant_id=${encodeURIComponent(participant_id)}`,
    { responseType: "blob" }
  );
  return res.data;
}

export async function exportAllParticipantsZip(): Promise<Blob> {
  const res = await http.get("/api/admin/export_all", {
    responseType: "blob",
  });
  return res.data;
}

/* -------------------- LEGACY UI SUPPORT -------------------- */

export function exportJSON(_: string) {
  alert("JSON export not enabled in minimal build.");
}

export function exportExcel(_: string) {
  alert("Excel export not enabled in minimal build.");
}

export async function changeAdminPassword(_: string, __: string) {
  return { ok: false, error: "Not implemented in minimal build" };
}
