import { useEffect, useState } from "react";
import { getParticipants } from "@/api/admin";

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getParticipants();
      if (res.ok) {
        setParticipants(res.data);
      }
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Participants</h1>

      {loading && <p>Loading...</p>}

      {!loading &&
        participants.map((p) => (
          <div key={p.participant_id} className="border p-3 rounded mb-2">
            <p>ID: {p.participant_id}</p>
            <p>Group: {p.assignment_group}</p>
            <p>Created: {p.created_at}</p>
          </div>
        ))}
    </div>
  );
}
