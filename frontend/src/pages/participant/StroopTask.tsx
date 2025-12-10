import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StressIndicatorDot } from "@/components/shared/StressIndicatorDot";
import { TimerBar } from "@/components/shared/TimerBar";
import { TaskStimulusCard } from "@/components/shared/TaskStimulusCard";
import { Pause, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const colorWords = ["RED", "BLUE", "GREEN", "YELLOW"];
const colors: Record<string, string> = {
  RED: "#ef4444",
  BLUE: "#3b82f6",
  GREEN: "#22c55e",
  YELLOW: "#eab308",
};

export default function StroopTask() {
  const navigate = useNavigate();
  const [currentWord, setCurrentWord] = useState("BLUE");
  const [currentColor, setCurrentColor] = useState("RED");
  const [timerProgress, setTimerProgress] = useState(0);
  const [trialCount, setTrialCount] = useState(1);
  const [totalTrials] = useState(15);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [stressLevel, setStressLevel] = useState<"low" | "medium" | "high">("low");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerProgress(prev => {
        if (prev >= 100) {
          handleTimeout();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [trialCount]);

  const handleTimeout = () => {
    setFeedback("incorrect");
    setTimeout(() => nextTrial(), 500);
  };

  const handleColorSelect = (selectedColor: string) => {
    const isCorrect = selectedColor === currentColor;
    setFeedback(isCorrect ? "correct" : "incorrect");
    
    // Update stress based on performance
    if (!isCorrect) {
      setStressLevel(prev => prev === "low" ? "medium" : "high");
    }
    
    setTimeout(() => nextTrial(), 500);
  };

  const nextTrial = () => {
    setFeedback(null);
    setTimerProgress(0);
    
    if (trialCount >= totalTrials) {
      navigate("/participant/reaction");
      return;
    }
    
    // Generate new stimulus (incongruent)
    const newWord = colorWords[Math.floor(Math.random() * colorWords.length)];
    let newColor = colorWords[Math.floor(Math.random() * colorWords.length)];
    while (newColor === newWord) {
      newColor = colorWords[Math.floor(Math.random() * colorWords.length)];
    }
    
    setCurrentWord(newWord);
    setCurrentColor(newColor);
    setTrialCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Stroop Task</h1>
          <div className="flex items-center gap-2">
            <StressIndicatorDot level={stressLevel} size="sm" />
            <span className="text-sm text-muted-foreground capitalize">{stressLevel} stress</span>
          </div>
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

      {/* Timer Bar */}
      <div className="max-w-2xl mx-auto w-full mb-12">
        <TimerBar 
          progress={timerProgress} 
          height="md" 
          showLabel 
          label="Time remaining"
        />
      </div>

      {/* Main Task Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        {/* Stimulus */}
        <div className="relative">
          <TaskStimulusCard 
            content={currentWord} 
            color={colors[currentColor]} 
            size="xl"
          />
          
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

        {/* Instructions */}
        <p className="text-lg text-muted-foreground">
          Select the <span className="font-semibold text-foreground">COLOR</span> of the text, not the word
        </p>

        {/* Color Options */}
        <div className="flex items-center gap-4">
          {colorWords.map((color) => (
            <Button
              key={color}
              variant="task"
              size="lg"
              className="min-w-[120px] h-14 text-lg font-bold transition-transform hover:scale-105"
              style={{ 
                color: colors[color],
                borderColor: colors[color] + "40"
              }}
              onClick={() => handleColorSelect(color)}
            >
              {color}
            </Button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        Click the button matching the <span className="font-semibold">ink color</span> of the word above
      </div>
    </div>
  );
}
