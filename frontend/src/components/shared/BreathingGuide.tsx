import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BreathingGuideProps {
  cycleDuration?: number; // seconds for full cycle
  className?: string;
}

export function BreathingGuide({ 
  cycleDuration = 8,
  className 
}: BreathingGuideProps) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phaseTime = (cycleDuration * 1000) / 3;
    let interval: NodeJS.Timeout;

    const updateProgress = () => {
      setProgress(prev => {
        const next = prev + 2;
        if (next >= 100) {
          setPhase(current => {
            if (current === "inhale") return "hold";
            if (current === "hold") return "exhale";
            return "inhale";
          });
          return 0;
        }
        return next;
      });
    };

    interval = setInterval(updateProgress, phaseTime / 50);

    return () => clearInterval(interval);
  }, [cycleDuration]);

  const phaseLabels = {
    inhale: "Breathe In",
    hold: "Hold",
    exhale: "Breathe Out",
  };

  const scaleValue = phase === "inhale" 
    ? 1 + (progress / 100) * 0.3 
    : phase === "exhale" 
      ? 1.3 - (progress / 100) * 0.3 
      : 1.3;

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Breathing Circle */}
      <div className="relative w-48 h-48">
        {/* Outer glow ring */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl transition-transform duration-1000"
          style={{ transform: `scale(${scaleValue})` }}
        />
        
        {/* Main circle */}
        <div 
          className="absolute inset-4 rounded-full primary-gradient shadow-glow transition-transform duration-1000 flex items-center justify-center"
          style={{ transform: `scale(${scaleValue * 0.9})` }}
        >
          <div className="text-center text-primary-foreground">
            <p className="text-2xl font-semibold">{phaseLabels[phase]}</p>
          </div>
        </div>

        {/* Inner pulse */}
        <div 
          className="absolute inset-8 rounded-full bg-primary-foreground/20 transition-transform duration-1000"
          style={{ transform: `scale(${scaleValue * 0.7})` }}
        />
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2">
        {["inhale", "hold", "exhale"].map((p) => (
          <div
            key={p}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              phase === p 
                ? "bg-primary scale-125" 
                : "bg-muted"
            )}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Follow the circle to calm your breathing
      </p>
    </div>
  );
}
