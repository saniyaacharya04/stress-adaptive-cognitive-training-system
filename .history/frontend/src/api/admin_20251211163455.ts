// src/api/admin.ts
import { http } from "@/api/http";

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

/* ---------------------- ADMIN LOGIN ---------------------- */
export async function adminLogin(
  username: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const res = await http.post("/api/admin/login", { username, password });

  const payload = res.data as { ok: boolean; token?: string; error?: string };

  if (payload.ok && payload.token) {
    return {
      ok: true,
      data: {
        token: payload.token,
        role: "admin",
      },
    };
  }

  return {
    ok: false,
    data: null as any,
    error: payload.error || "Login failed",
  };
}

/* ---------------------- PARTICIPANTS ---------------------- */
export async function getParticipants() {
  const res = await http.get("/api/admin/participants");
  return res.data;
}

/* ---------------------- LOG QUERY ---------------------- */
export async function queryLogs(body: any) {
  const res = await http.post("/api/admin/logs/query", body);
  return res.data;
}

/* ---------------------- EXPORT LOGS ---------------------- */
export function exportLogs(participant_id: string) {
  window.open(
    `/api/admin/export?participant_id=${encodeURIComponent(participant_id)}`,
    "_blank"
  );
}
