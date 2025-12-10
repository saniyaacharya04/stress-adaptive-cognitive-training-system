import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BreathingGuide } from "@/components/shared/BreathingGuide";
import { Play, Coffee, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BreakScreen() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleContinue = () => {
    navigate(-1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-calm-lavender/40 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-calm-mint/40 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-calm-blue/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full space-y-10 text-center animate-fade-in-up">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-calm-mint border border-stress-low/20">
              <Coffee className="w-8 h-8 text-stress-low" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Take a Break</h1>
          <p className="text-muted-foreground">
            Rest your eyes and follow the breathing guide below
          </p>
        </div>

        {/* Breathing Guide */}
        <BreathingGuide cycleDuration={8} />

        {/* Timer */}
        <div className="space-y-4">
          <div className="glass-card p-6 inline-block">
            <p className="text-sm text-muted-foreground mb-1">Auto-continue in</p>
            <p className="text-4xl font-bold font-mono">{formatTime(countdown)}</p>
          </div>
        </div>

        {/* Tips */}
        <div className="glass-card p-6 text-left space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent" />
            Relaxation Tips
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Look away from the screen and focus on something distant
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Roll your shoulders and stretch your neck gently
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Take slow, deep breaths following the animation above
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? "Resume Timer" : "Pause Timer"}
          </Button>
          <Button
            variant="gradient"
            size="lg"
            className="gap-2"
            onClick={handleContinue}
          >
            <Play className="w-5 h-5" />
            Continue Session
          </Button>
        </div>
      </div>
    </div>
  );
}
