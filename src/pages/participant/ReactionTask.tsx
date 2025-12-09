import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StressIndicatorDot } from "@/components/shared/StressIndicatorDot";
import { Pause, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type TaskState = "ready" | "waiting" | "stimulus" | "result" | "early";

export default function ReactionTask() {
  const navigate = useNavigate();
  const [state, setState] = useState<TaskState>("ready");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [stimulusTime, setStimulusTime] = useState<number>(0);
  const [trialCount, setTrialCount] = useState(1);
  const [totalTrials] = useState(10);
  const [results, setResults] = useState<number[]>([]);

  const startTrial = useCallback(() => {
    setState("waiting");
    const delay = 1500 + Math.random() * 3000; // 1.5-4.5 seconds
    
    setTimeout(() => {
      setState("stimulus");
      setStimulusTime(Date.now());
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (state === "waiting") {
      setState("early");
      setTimeout(() => setState("ready"), 1500);
      return;
    }
    
    if (state === "stimulus") {
      const rt = Date.now() - stimulusTime;
      setReactionTime(rt);
      setResults(prev => [...prev, rt]);
      setState("result");
    }
    
    if (state === "ready" || state === "result") {
      if (trialCount >= totalTrials) {
        navigate("/participant/complete", { 
          state: { reactionTimes: results }
        });
        return;
      }
      setTrialCount(prev => prev + 1);
      startTrial();
    }
  }, [state, stimulusTime, trialCount, totalTrials, results, navigate, startTrial]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleClick]);

  const averageRT = results.length > 0 
    ? Math.round(results.reduce((a, b) => a + b, 0) / results.length)
    : null;

  const getStateStyles = () => {
    switch (state) {
      case "ready":
        return "bg-muted";
      case "waiting":
        return "bg-stress-high/20";
      case "stimulus":
        return "bg-stress-low shadow-[0_0_60px_hsl(142,76%,36%,0.5)]";
      case "result":
        return "bg-primary/10";
      case "early":
        return "bg-stress-high/30";
      default:
        return "bg-muted";
    }
  };

  const getStateContent = () => {
    switch (state) {
      case "ready":
        return {
          title: "Ready?",
          subtitle: "Click or press Space to begin",
          icon: null,
        };
      case "waiting":
        return {
          title: "Wait...",
          subtitle: "Click when you see the green flash",
          icon: null,
        };
      case "stimulus":
        return {
          title: "NOW!",
          subtitle: "Click as fast as you can!",
          icon: <Zap className="w-24 h-24 text-stress-low" />,
        };
      case "result":
        return {
          title: `${reactionTime}ms`,
          subtitle: "Nice! Click to continue",
          icon: null,
        };
      case "early":
        return {
          title: "Too Early!",
          subtitle: "Wait for the green stimulus",
          icon: null,
        };
      default:
        return { title: "", subtitle: "", icon: null };
    }
  };

  const content = getStateContent();

  return (
    <div className="min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Reaction Time Task</h1>
          <StressIndicatorDot level="low" size="sm" />
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
      <div 
        className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={handleClick}
      >
        <div 
          className={`w-80 h-80 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-200 ${getStateStyles()}`}
        >
          {content.icon}
          <h2 className={`text-4xl font-bold ${state === "result" ? "font-mono" : ""}`}>
            {content.title}
          </h2>
          <p className="text-muted-foreground text-center px-6">
            {content.subtitle}
          </p>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-center gap-12 py-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Best Time</p>
          <p className="text-2xl font-bold font-mono">
            {results.length > 0 ? `${Math.min(...results)}ms` : "—"}
          </p>
        </div>
        <div className="w-px h-12 bg-border" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="text-2xl font-bold font-mono">
            {averageRT ? `${averageRT}ms` : "—"}
          </p>
        </div>
        <div className="w-px h-12 bg-border" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Trials</p>
          <p className="text-2xl font-bold">
            {results.length} / {totalTrials}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        Press <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">Space</kbd> or click anywhere to respond
      </div>
    </div>
  );
}
