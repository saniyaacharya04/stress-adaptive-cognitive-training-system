import { cn } from "@/lib/utils";

interface StressGaugeProps {
  level: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

export function StressGauge({ 
  level, 
  size = "md", 
  showLabel = true,
  animated = true 
}: StressGaugeProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = size === "sm" ? 24 : size === "md" ? 40 : 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;

  const getStressColor = (level: number) => {
    if (level < 33) return "stroke-stress-low";
    if (level < 66) return "stroke-stress-medium";
    return "stroke-stress-high";
  };

  const getStressLabel = (level: number) => {
    if (level < 33) return "Low";
    if (level < 66) return "Medium";
    return "High";
  };

  const getGlowColor = (level: number) => {
    if (level < 33) return "drop-shadow-[0_0_10px_hsl(142,76%,36%,0.5)]";
    if (level < 66) return "drop-shadow-[0_0_10px_hsl(45,93%,47%,0.5)]";
    return "drop-shadow-[0_0_10px_hsl(0,84%,60%,0.5)]";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        <svg 
          className={cn(
            "transform -rotate-90 w-full h-full",
            animated && "transition-all duration-500",
            getGlowColor(level)
          )}
          viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              getStressColor(level),
              animated && "transition-all duration-700 ease-out"
            )}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-semibold",
            size === "sm" && "text-sm",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl"
          )}>
            {Math.round(level)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">
          Stress: {getStressLabel(level)}
        </span>
      )}
    </div>
  );
}
