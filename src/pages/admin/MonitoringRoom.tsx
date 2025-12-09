import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ParticipantTile } from "@/components/shared/ParticipantTile";
import { Users, MonitorPlay, MonitorOff, LayoutGrid, List } from "lucide-react";

const mockLiveParticipants = [
  { id: "P-2024-0042", stress: 35, difficulty: 3, task: "N-Back", pupil: 55, blink: 14 },
  { id: "P-2024-0041", stress: 58, difficulty: 2, task: "Stroop", pupil: 62, blink: 18 },
  { id: "P-2024-0040", stress: 72, difficulty: 4, task: "N-Back", pupil: 70, blink: 22 },
  { id: "P-2024-0038", stress: 28, difficulty: 2, task: "Break", pupil: 45, blink: 12 },
  { id: "P-2024-0037", stress: 45, difficulty: 3, task: "Reaction", pupil: 58, blink: 15 },
  { id: "P-2024-0036", stress: 82, difficulty: 5, task: "N-Back", pupil: 75, blink: 25 },
];

export default function MonitoringRoom() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Monitoring Room</h1>
          {isMonitoring && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-stress-low/10 text-stress-low text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-stress-low animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant={isMonitoring ? "danger" : "success"}
            className="gap-2"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? (
              <>
                <MonitorOff className="w-4 h-4" />
                Leave Room
              </>
            ) : (
              <>
                <MonitorPlay className="w-4 h-4" />
                Join Room
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 p-4 glass-card">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-medium">{mockLiveParticipants.length} Active</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stress-low" />
            Low Stress: {mockLiveParticipants.filter(p => p.stress < 40).length}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stress-medium" />
            Medium: {mockLiveParticipants.filter(p => p.stress >= 40 && p.stress < 70).length}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stress-high" />
            High: {mockLiveParticipants.filter(p => p.stress >= 70).length}
          </span>
        </div>
      </div>

      {/* Participant Grid */}
      {isMonitoring ? (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        }>
          {mockLiveParticipants.map((participant) => (
            <ParticipantTile
              key={participant.id}
              participantId={participant.id}
              stressLevel={participant.stress}
              difficultyLevel={participant.difficulty}
              currentTask={participant.task}
              isLive
              pupilDilation={participant.pupil}
              blinkRate={participant.blink}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 rounded-full bg-muted mb-4">
            <MonitorOff className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Monitoring Paused</h2>
          <p className="text-muted-foreground mb-6">
            Click "Join Room" to start monitoring active sessions
          </p>
          <Button
            variant="gradient"
            size="lg"
            className="gap-2"
            onClick={() => setIsMonitoring(true)}
          >
            <MonitorPlay className="w-5 h-5" />
            Join Monitoring Room
          </Button>
        </div>
      )}
    </div>
  );
}
