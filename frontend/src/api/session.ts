import { http } from "./http";

export interface SessionResponse {
  ok: boolean;
  data: {
    participant_id: string;
    token: string;
    expires_at: string;
  };
}

export async function createSession(participant_id: string): Promise<SessionResponse> {
  const res = await http.post<SessionResponse>("/api/session", { participant_id });
  return res.data;
}
