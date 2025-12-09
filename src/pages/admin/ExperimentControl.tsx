import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/shared/MetricCard";
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Users, 
  Clock,
  Target,
  Activity,
  AlertTriangle
} from "lucide-react";

export default function ExperimentControl() {
  const [isRunning, setIsRunning] = useState(true);
  const [protocol, setProtocol] = useState("adaptive-pid");
  const [progress, setProgress] = useState(67);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Experiment Control</h1>
          <p className="text-muted-foreground">
            Manage experiment protocols and monitor progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-stress-low/10 text-stress-low font-medium">
              <span className="w-2 h-2 rounded-full bg-stress-low animate-pulse" />
              Experiment Running
            </span>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Control Panel
          </h2>
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <Button 
                variant="success" 
                size="lg" 
                className="gap-2"
                onClick={() => setIsRunning(true)}
              >
                <Play className="w-5 h-5" />
                Start Experiment
              </Button>
            ) : (
              <>
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setIsRunning(false)}
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
                <Button 
                  variant="danger" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setIsRunning(false)}
                >
                  <Square className="w-5 h-5" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Protocol Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Protocol</label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adaptive-pid">Adaptive PID Control</SelectItem>
                <SelectItem value="fixed-difficulty">Fixed Difficulty</SelectItem>
                <SelectItem value="staircase">Staircase Method</SelectItem>
                <SelectItem value="baseline">Baseline Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Duration</label>
            <Select defaultValue="20">
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Sequence</label>
            <Select defaultValue="nsr">
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nsr">N-Back → Stroop → Reaction</SelectItem>
                <SelectItem value="rsn">Reaction → Stroop → N-Back</SelectItem>
                <SelectItem value="random">Randomized</SelectItem>
                <SelectItem value="nback-only">N-Back Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Experiment Progress</span>
            <span className="text-muted-foreground">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Started: Dec 1, 2024</span>
            <span>Target: 50 participants</span>
            <span>Est. completion: Dec 20, 2024</span>
          </div>
        </div>
      </div>

      {/* Real-time Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Participants"
          value="6"
          subtitle="Currently in session"
          icon={Users}
          variant="success"
        />
        <MetricCard
          title="Avg Session Duration"
          value="18:32"
          subtitle="Today's sessions"
          icon={Clock}
          variant="primary"
        />
        <MetricCard
          title="Current Accuracy"
          value="84.7%"
          subtitle="Across all tasks"
          icon={Target}
          variant="accent"
        />
        <MetricCard
          title="Avg Stress Level"
          value="42%"
          subtitle="Real-time average"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Alerts Section */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-stress-medium" />
          Active Alerts
        </h3>
        <div className="space-y-3">
          {[
            { participant: "P-2024-0040", message: "High stress level detected (78%)", time: "2 min ago", severity: "high" },
            { participant: "P-2024-0036", message: "Session timeout warning", time: "8 min ago", severity: "medium" },
          ].map((alert, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                alert.severity === "high" 
                  ? "bg-stress-high/5 border-stress-high/20" 
                  : "bg-stress-medium/5 border-stress-medium/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  alert.severity === "high" ? "bg-stress-high" : "bg-stress-medium"
                }`} />
                <div>
                  <span className="font-mono font-medium">{alert.participant}</span>
                  <span className="text-muted-foreground mx-2">—</span>
                  <span>{alert.message}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{alert.time}</span>
                <Button variant="outline" size="sm">Dismiss</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
