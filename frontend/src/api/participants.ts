import { http } from "@/api/http";

export interface RegisterResponse {
  ok: boolean;
  participant_id: string;
  group: string;
}

export async function registerParticipant(): Promise<RegisterResponse> {
  const res = await http.post("/api/register", {});
  return res.data as RegisterResponse; // backend shape matches
}
