import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StressGauge } from "@/components/shared/StressGauge";
import { DifficultyMeter } from "@/components/shared/DifficultyMeter";
import { TaskStimulusCard } from "@/components/shared/TaskStimulusCard";
import { Check, X, Pause } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import useTaskEngine from "@/hooks/useTaskEngine";
import useSocket from "@/hooks/useSocket";

// Same letters you used
const letters = ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T"];

export default function NBackTask() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = location.state?.token;
  const participantId = location.state?.participantId;

  const { start, sendTrial, finish } = useTaskEngine(token, participantId);
  const socket = useSocket(participantId);

  // === EXISTING UI STATES (preserved) ===
  const [currentLetter, setCurrentLetter] = useState("F");
  const [difficultyLevel, setDifficultyLevel] = useState(2);      // backend updates this
  const [stressLevel, setStressLevel] = useState(35);             // backend updates this
  const [trialCount, setTrialCount] = useState(1);
  const totalTrials = 20;

  const [accuracy, setAccuracy] = useState(85);                   // can update with real data
  const [reactionTime, setReactionTime] = useState(450);

  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  // N-back trail history
  const [stimHistory, setStimHistory] = useState<string[]>([]);

  // -----------------------------
  // SOCKET LISTENERS (difficulty + stress)
  // -----------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on(`difficulty_update_${participantId}`, (msg) => {
      setDifficultyLevel(msg.difficulty);
    });

    socket.on(`stress_update_${participantId}`, (msg) => {
      const scaled = Math.floor(msg.ema_high * 100);
      setStressLevel(scaled);
    });

    return () => {
      socket?.off(`difficulty_update_${participantId}`);
      socket?.off(`stress_update_${participantId}`);
    };
  }, [socket, participantId]);


  // -----------------------------
  // START TASK SESSION (Phase 3)
  // -----------------------------
  useEffect(() => {
    async function init() {
      await start("nback", { block: 1 });
    }
    init();
  }, []);


  // -----------------------------
  // CHECK MATCH USING REAL N-BACK RULE
  // -----------------------------
  function isMatch(letter: string): boolean {
    const n = difficultyLevel;
    if (stimHistory.length < n) return false;
    return letter === stimHistory[stimHistory.length - n];
  }


  // -----------------------------
  // RESPONSE HANDLER
  // -----------------------------
  const handleResponse = useCallback(
    async (userSaysMatch: boolean) => {
      const match = isMatch(currentLetter);
      const correct = userSaysMatch === match;

      // show UI feedback
      setFeedback(correct ? "correct" : "incorrect");

      // send event to backend
      await sendTrial({
        task: "nback",
        stimulus: currentLetter,
        response: userSaysMatch ? "match" : "no_match",
        correct,
        reaction_time_ms: reactionTime
      });

      // small delay for UX
      setTimeout(() => {
        setFeedback(null);

        // generate next letter
        const next = letters[Math.floor(Math.random() * letters.length)];
        setCurrentLetter(next);
        setStimHistory((prev) => [...prev, next]);

        // update trial count
        setTrialCount((prev) => {
          if (prev >= totalTrials) {
            finish();
            navigate("/participant/stroop", {
              state: { token, participantId }
            });
            return prev;
          }
          return prev + 1;
        });

        // random fluctuation (temporary)
        setReactionTime(Math.floor(300 + Math.random() * 300));
        setAccuracy((acc) => acc + (correct ? 1 : -1));
      }, 700);
    },
    [currentLetter, difficultyLevel, reactionTime, navigate, token, participantId]
  );


  // -----------------------------
  // KEYBOARD INPUT (A / D)
  // -----------------------------
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "ArrowLeft") handleResponse(true);
      if (e.key === "d" || e.key === "ArrowRight") handleResponse(false);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleResponse]);


  // -----------------------------
  // RENDER UI (unchanged)
  // -----------------------------
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
          <Link to="/participant/break" state={{ token, participantId }}>
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

          {/* Stress Panel */}
          <div className="flex flex-col items-center gap-4">
            <StressGauge level={stressLevel} size="md" />
          </div>

          {/* Stimulus & Feedback */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <TaskStimulusCard content={currentLetter} size="xl" />

              {feedback && (
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-3xl ${
                    feedback === "correct"
                      ? "bg-stress-low/20 border-2 border-stress-low"
                      : "bg-stress-high/20 border-2 border-stress-high"
                  }`}
                >
                  {feedback === "correct" ? (
                    <Check className="w-16 h-16 text-stress-low" />
                  ) : (
                    <X className="w-16 h-16 text-stress-high" />
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
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

            {/* Stats */}
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

          {/* Difficulty Panel */}
          <div className="flex flex-col items-center gap-4">
            <DifficultyMeter level={difficultyLevel} size="lg" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        Press <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">A</kbd> / 
        <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">←</kbd> for Match · 
        Press <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">D</kbd> / 
        <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">→</kbd> for No Match
      </div>
    </div>
  );
}
