import { Eye, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaceMetricsCardProps {
  pupilDilation: number; // 0-100 percentage
  blinkRate: number; // blinks per minute
  className?: string;
}

export function FaceMetricsCard({ 
  pupilDilation, 
  blinkRate,
  className 
}: FaceMetricsCardProps) {
  const getPupilStatus = (value: number) => {
    if (value < 40) return { label: "Contracted", color: "text-stress-low" };
    if (value < 70) return { label: "Normal", color: "text-stress-medium" };
    return { label: "Dilated", color: "text-stress-high" };
  };

  const getBlinkStatus = (value: number) => {
    if (value < 10) return { label: "Low", color: "text-stress-high" };
    if (value < 20) return { label: "Normal", color: "text-stress-low" };
    return { label: "Elevated", color: "text-stress-medium" };
  };

  const pupilStatus = getPupilStatus(pupilDilation);
  const blinkStatus = getBlinkStatus(blinkRate);

  return (
    <div className={cn(
      "glass-card p-4 space-y-4",
      className
    )}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Face Metrics
      </h3>
      
      <div className="space-y-4">
        {/* Pupil Dilation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Pupil Dilation</span>
            </div>
            <span className={cn("text-sm font-semibold", pupilStatus.color)}>
              {pupilStatus.label}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pupilDilation}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{pupilDilation}%</span>
        </div>

        {/* Blink Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm font-medium">Blink Rate</span>
            </div>
            <span className={cn("text-sm font-semibold", blinkStatus.color)}>
              {blinkStatus.label}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min(blinkRate / 30 * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{blinkRate} bpm</span>
        </div>
      </div>
    </div>
  );
}
