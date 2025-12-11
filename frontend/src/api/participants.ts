// frontend/src/api/participants.ts
import { http } from "./http";

export interface RegisterResponse {
  ok: boolean;
  data: {
    participant_id: string;
    assignment_group: string;
  };
}

export async function registerParticipant(): Promise<RegisterResponse> {
  const res = await http.post<RegisterResponse>("/api/register", {});
  return res.data;
}
