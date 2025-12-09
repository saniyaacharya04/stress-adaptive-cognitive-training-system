import { cn } from "@/lib/utils";

interface StressIndicatorDotProps {
  level: "low" | "medium" | "high";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function StressIndicatorDot({ 
  level, 
  size = "md",
  animated = true 
}: StressIndicatorDotProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const colorClasses = {
    low: "bg-stress-low shadow-[0_0_12px_hsl(142,76%,36%,0.6)]",
    medium: "bg-stress-medium shadow-[0_0_12px_hsl(45,93%,47%,0.6)]",
    high: "bg-stress-high shadow-[0_0_12px_hsl(0,84%,60%,0.6)]",
  };

  return (
    <div 
      className={cn(
        "rounded-full",
        sizeClasses[size],
        colorClasses[level],
        animated && "animate-pulse-slow"
      )}
    />
  );
}
