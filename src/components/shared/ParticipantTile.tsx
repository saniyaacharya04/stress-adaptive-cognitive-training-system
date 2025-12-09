import { cn } from "@/lib/utils";
import { StressGauge } from "./StressGauge";
import { DifficultyMeter } from "./DifficultyMeter";
import { StressIndicatorDot } from "./StressIndicatorDot";
import { User, Activity } from "lucide-react";

interface ParticipantTileProps {
  participantId: string;
  stressLevel: number;
  difficultyLevel: number;
  currentTask: string;
  isLive?: boolean;
  pupilDilation?: number;
  blinkRate?: number;
  className?: string;
}

export function ParticipantTile({
  participantId,
  stressLevel,
  difficultyLevel,
  currentTask,
  isLive = true,
  pupilDilation = 50,
  blinkRate = 15,
  className,
}: ParticipantTileProps) {
  const getStressIndicator = (level: number): "low" | "medium" | "high" => {
    if (level < 33) return "low";
    if (level < 66) return "medium";
    return "high";
  };

  return (
    <div className={cn(
      "glass-card p-4 space-y-4 hover:shadow-glow transition-all duration-300",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">{participantId}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-stress-low">
              <span className="w-2 h-2 rounded-full bg-stress-low animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Task Status */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{currentTask}</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <StressGauge level={stressLevel} size="sm" showLabel={false} />
          <span className="text-xs text-muted-foreground mt-1">Stress</span>
        </div>
        <div className="flex flex-col items-center">
          <DifficultyMeter level={difficultyLevel} size="sm" showLabel={false} />
          <span className="text-xs text-muted-foreground mt-1">Difficulty</span>
        </div>
      </div>

      {/* Face Metrics Mini */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
        <div className="flex items-center gap-1">
          <span>Pupil:</span>
          <span className="font-mono font-medium text-foreground">{pupilDilation}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Blink:</span>
          <span className="font-mono font-medium text-foreground">{blinkRate}/m</span>
        </div>
        <StressIndicatorDot level={getStressIndicator(stressLevel)} size="sm" />
      </div>
    </div>
  );
}
