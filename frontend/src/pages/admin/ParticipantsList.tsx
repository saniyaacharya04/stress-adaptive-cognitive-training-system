import { useEffect, useState } from "react";
import { getParticipants } from "@/api/admin";
import { Link } from "react-router-dom";

export default function ParticipantsList() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getParticipants();
        if (res?.ok) setParticipants(res.data || []);
      } catch (e) {
        console.error("Error fetching participants", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">Participants</h1>

      {loading && <p>Loading...</p>}

      <div className="space-y-3">
        {participants.map(p => (
          <div key={p.participant_id} className="glass-card p-4 flex justify-between items-center">
            <div>
              <div className="font-mono">{p.participant_id}</div>
              <div className="text-sm text-muted-foreground">{p.assignment_group}</div>
            </div>
            <div className="space-x-2">
              <Link to={`/admin/participants/${encodeURIComponent(p.participant_id)}`} className="btn">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
