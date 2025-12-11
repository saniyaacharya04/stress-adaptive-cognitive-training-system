export default function ParticipantCard({ participant }: { participant: any }) {
  return (
    <div className="border rounded p-3">
      <div className="font-mono">{participant.participant_id}</div>
      <div className="text-sm text-muted-foreground">{participant.assignment_group}</div>
      <div className="text-xs text-muted-foreground mt-2">{participant.created_at}</div>
    </div>
  );
}
