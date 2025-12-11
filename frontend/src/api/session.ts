import { http } from "@/api/http";

export interface SessionResponse {
  token: string;
  expires_at: string;
}

export async function createSession(
  participant_id: string
): Promise<SessionResponse> {
  const res = await http.post("/api/session", { participant_id });

  const payload = res.data as {
    ok: boolean;
    data: { token: string; expires_at: string };
  };

  return payload.data;
}
