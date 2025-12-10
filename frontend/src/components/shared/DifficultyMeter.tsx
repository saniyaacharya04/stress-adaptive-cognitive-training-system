import { cn } from "@/lib/utils";

interface DifficultyMeterProps {
  level: number; // 1-5
  orientation?: "vertical" | "horizontal";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DifficultyMeter({ 
  level, 
  orientation = "vertical",
  showLabel = true,
  size = "md"
}: DifficultyMeterProps) {
  const levels = [1, 2, 3, 4, 5];

  const getDifficultyColor = (lvl: number) => {
    const colors: Record<number, string> = {
      1: "bg-difficulty-1",
      2: "bg-difficulty-2", 
      3: "bg-difficulty-3",
      4: "bg-difficulty-4",
      5: "bg-difficulty-5",
    };
    return colors[lvl] || "bg-muted";
  };

  const getGlowColor = (lvl: number) => {
    const glows: Record<number, string> = {
      1: "shadow-[0_0_10px_hsl(152,76%,50%,0.5)]",
      2: "shadow-[0_0_10px_hsl(160,70%,45%,0.5)]",
      3: "shadow-[0_0_10px_hsl(45,93%,50%,0.5)]",
      4: "shadow-[0_0_10px_hsl(25,95%,55%,0.5)]",
      5: "shadow-[0_0_10px_hsl(0,84%,60%,0.5)]",
    };
    return glows[lvl] || "";
  };

  const sizeClasses = {
    sm: orientation === "vertical" ? "w-3 h-4" : "w-4 h-3",
    md: orientation === "vertical" ? "w-4 h-6" : "w-6 h-4",
    lg: orientation === "vertical" ? "w-6 h-8" : "w-8 h-6",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Difficulty
        </span>
      )}
      <div className={cn(
        "flex",
        orientation === "vertical" ? "flex-col-reverse" : "flex-row",
        gapClasses[size]
      )}>
        {levels.map((lvl) => (
          <div
            key={lvl}
            className={cn(
              "rounded-sm transition-all duration-300",
              sizeClasses[size],
              lvl <= level 
                ? cn(getDifficultyColor(level), getGlowColor(level)) 
                : "bg-muted/40"
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-lg font-bold">
          Level {level}
        </span>
      )}
    </div>
  );
}
