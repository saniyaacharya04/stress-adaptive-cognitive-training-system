import { useEffect, useState } from "react";
import { getParticipants } from "@/api/admin";
import ParticipantCard from "@/components/admin/ParticipantCard";

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getParticipants();
        if (res?.ok) setParticipants(res.data || []);
      } catch (e) {
        console.error("Failed to load participants", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <h3 className="font-semibold">Overview</h3>
          <p className="text-sm mt-2">Total participants: {participants.length}</p>
        </div>

        <div className="glass-card p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Recent participants</h3>
          <div className="space-y-3">
            {loading ? (
              <p>Loading...</p>
            ) : (
              participants.slice(0,6).map(p => <ParticipantCard key={p.participant_id} participant={p} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
