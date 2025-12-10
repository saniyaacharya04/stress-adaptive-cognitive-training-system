import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RealtimeChart } from "@/components/shared/RealtimeChart";
import { FaceMetricsCard } from "@/components/shared/FaceMetricsCard";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DifficultyMeter } from "@/components/shared/DifficultyMeter";
import { ArrowLeft, User, Calendar, Clock, Target } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const stressTimeline = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}`,
  value: 25 + Math.sin(i / 3) * 20 + Math.random() * 15,
}));

const learningCurve = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}`,
  value: 60 + (i / 30) * 25 + Math.random() * 10,
}));

const difficultyTrajectory = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}`,
  value: 1 + Math.floor(i / 8) + (Math.random() > 0.7 ? 1 : 0),
}));

export default function ParticipantDetail() {
  const { id } = useParams();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/participants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-mono">{id || "P-2024-0042"}</h1>
            <p className="text-muted-foreground">Participant Details & Analytics</p>
          </div>
        </div>
        <ExportButtons 
          onExportCSV={() => {}}
          onExportPDF={() => {}}
          onExportJSON={() => {}}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Group</p>
            <p className="font-semibold">Adaptive</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Enrolled</p>
            <p className="font-semibold">Dec 1, 2024</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-stress-low/10">
            <Clock className="w-5 h-5 text-stress-low" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sessions</p>
            <p className="font-semibold">8 completed</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-stress-medium/10">
            <Target className="w-5 h-5 text-stress-medium" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Accuracy</p>
            <p className="font-semibold">87.3%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stress Timeline */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Stress Timeline</h3>
          <p className="text-sm text-muted-foreground">Physiological stress levels across sessions</p>
          <RealtimeChart 
            data={stressTimeline} 
            color="stress-medium"
            height={200}
            unit="%"
          />
        </div>

        {/* Learning Curve */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Learning Curve</h3>
          <p className="text-sm text-muted-foreground">Accuracy improvement over trials</p>
          <RealtimeChart 
            data={learningCurve} 
            color="stress-low"
            height={200}
            unit="%"
          />
        </div>

        {/* Difficulty Trajectory */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Difficulty Trajectory (PID Output)</h3>
          <p className="text-sm text-muted-foreground">Adaptive difficulty levels over time</p>
          <RealtimeChart 
            data={difficultyTrajectory} 
            color="primary"
            height={200}
            showArea={false}
          />
          <div className="flex justify-center">
            <DifficultyMeter level={4} orientation="horizontal" size="md" />
          </div>
        </div>

        {/* Face Metrics Summary */}
        <div className="space-y-4">
          <FaceMetricsCard 
            pupilDilation={62}
            blinkRate={16}
          />
          <div className="glass-card p-6 space-y-3">
            <h3 className="font-semibold">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trials:</span>
                <span className="font-medium">342</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg RT:</span>
                <span className="font-medium font-mono">425ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best N-Back:</span>
                <span className="font-medium">4-back</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Breaks Taken:</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
