import { cn } from "@/lib/utils";

interface TimerBarProps {
  progress: number; // 0-100
  variant?: "default" | "warning" | "danger";
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function TimerBar({
  progress,
  variant = "default",
  height = "md",
  showLabel = false,
  label,
  className,
}: TimerBarProps) {
  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const getVariantColor = () => {
    if (variant === "danger" || progress > 80) return "bg-stress-high";
    if (variant === "warning" || progress > 60) return "bg-stress-medium";
    return "bg-primary";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label || "Time remaining"}</span>
          <span>{Math.round(100 - progress)}%</span>
        </div>
      )}
      <div className={cn(
        "w-full bg-muted rounded-full overflow-hidden",
        heightClasses[height]
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getVariantColor()
          )}
          style={{ width: `${100 - progress}%` }}
        />
      </div>
    </div>
  );
}
