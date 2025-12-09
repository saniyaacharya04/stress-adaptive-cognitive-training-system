import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StressGauge } from "@/components/shared/StressGauge";
import { DifficultyMeter } from "@/components/shared/DifficultyMeter";
import { TaskStimulusCard } from "@/components/shared/TaskStimulusCard";
import { Check, X, Pause, SkipForward } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T"];

export default function NBackTask() {
  const navigate = useNavigate();
  const [currentLetter, setCurrentLetter] = useState("F");
  const [difficultyLevel, setDifficultyLevel] = useState(2);
  const [stressLevel, setStressLevel] = useState(35);
  const [trialCount, setTrialCount] = useState(1);
  const [totalTrials] = useState(20);
  const [accuracy, setAccuracy] = useState(85);
  const [reactionTime, setReactionTime] = useState(450);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const handleResponse = useCallback((isMatch: boolean) => {
    // Simulate feedback
    const correct = Math.random() > 0.3;
    setFeedback(correct ? "correct" : "incorrect");
    
    setTimeout(() => {
      setFeedback(null);
      // Generate next stimulus
      setCurrentLetter(letters[Math.floor(Math.random() * letters.length)]);
      setTrialCount(prev => {
        if (prev >= totalTrials) {
          navigate("/participant/stroop");
          return prev;
        }
        return prev + 1;
      });
      
      // Simulate changing metrics
      setStressLevel(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 10)));
      setReactionTime(Math.floor(300 + Math.random() * 400));
    }, 800);
  }, [navigate, totalTrials]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        handleResponse(true);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        handleResponse(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleResponse]);

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">N-Back Task</h1>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {difficultyLevel}-back
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Trial {trialCount} / {totalTrials}
          </span>
          <Link to="/participant/break">
            <Button variant="ghost" size="sm" className="gap-2">
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Task Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-16">
          {/* Left Panel - Stress Gauge */}
          <div className="flex flex-col items-center gap-4">
            <StressGauge level={stressLevel} size="md" />
          </div>

          {/* Center - Stimulus */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <TaskStimulusCard content={currentLetter} size="xl" />
              
              {/* Feedback overlay */}
              {feedback && (
                <div className={`absolute inset-0 flex items-center justify-center rounded-3xl ${
                  feedback === "correct" 
                    ? "bg-stress-low/20 border-2 border-stress-low" 
                    : "bg-stress-high/20 border-2 border-stress-high"
                }`}>
                  {feedback === "correct" ? (
                    <Check className="w-16 h-16 text-stress-low" />
                  ) : (
                    <X className="w-16 h-16 text-stress-high" />
                  )}
                </div>
              )}
            </div>

            {/* Response Buttons */}
            <div className="flex items-center gap-6">
              <Button 
                variant="success" 
                size="lg" 
                className="gap-2 min-w-[140px]"
                onClick={() => handleResponse(true)}
              >
                <Check className="w-5 h-5" />
                Match (A)
              </Button>
              <Button 
                variant="danger" 
                size="lg" 
                className="gap-2 min-w-[140px]"
                onClick={() => handleResponse(false)}
              >
                <X className="w-5 h-5" />
                No Match (D)
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Accuracy</p>
                <p className="text-xl font-bold text-stress-low">{accuracy}%</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-muted-foreground">Reaction Time</p>
                <p className="text-xl font-bold font-mono">{reactionTime}ms</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Difficulty */}
          <div className="flex flex-col items-center gap-4">
            <DifficultyMeter level={difficultyLevel} size="lg" />
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="text-center text-sm text-muted-foreground py-4">
        Press <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">A</kbd> or <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">←</kbd> for Match · 
        Press <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">D</kbd> or <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">→</kbd> for No Match
      </div>
    </div>
  );
}
