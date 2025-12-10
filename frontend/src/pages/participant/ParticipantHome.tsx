import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Play, User, Heart } from "lucide-react";
import { StressIndicatorDot } from "@/components/shared/StressIndicatorDot";
import { useNavigate } from "react-router-dom";

import { registerParticipant } from "@/api/participants";
import { createSession } from "@/api/session";

export default function ParticipantHome() {
  const navigate = useNavigate();

  const [participantId, setParticipantId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleBegin = async () => {
    try {
      setLoading(true);

      // 1) REGISTER PARTICIPANT
      const reg = await registerParticipant();
      const pid = reg.data.participant_id;
      setParticipantId(pid);

      // 2) CREATE SESSION
      const ses = await createSession(pid);
      const token = ses.data.token;

      // Save for all tasks
      localStorage.setItem("participant_id", pid);
      localStorage.setItem("participant_token", token);

      // 3) Move to first task
      // Wait 800ms so UI updates visually
setTimeout(() => {
  navigate("/participant/nback");
}, 800);


    } catch (err) {
      console.error("SESSION START ERROR:", err);
      alert("Failed to start session. Check backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        <div className="glass-card p-8 space-y-6 text-center">

          {/* ICON */}
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl primary-gradient shadow-glow animate-pulse-slow">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* TITLE */}
          <h1 className="text-2xl font-bold">Welcome to SACTS</h1>
          <p className="text-muted-foreground text-sm">
            Stress-Adaptive Cognitive Training System
          </p>

          {/* PARTICIPANT ID */}
          <label className="text-sm font-medium flex items-center justify-center gap-2">
            <User className="w-4 h-4" />
            Your Participant ID
          </label>

          <Input
            readOnly
            value={participantId || "Will be assigned automatically"}
            className="text-center text-lg font-mono bg-muted"
          />

          {/* BASELINE STRESS */}
          <div className="flex items-center justify-center gap-3 py-4 px-6 
                          rounded-xl bg-calm-mint/30 border border-stress-low/20">
            <StressIndicatorDot level="low" />
            <span className="text-sm text-muted-foreground">
              Baseline stress: <span className="font-medium text-stress-low">Normal</span>
            </span>
          </div>

          {/* INSTRUCTIONS */}
          <div className="text-left space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Before you begin
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Find a quiet space</li>
              <li>• Ensure your camera is positioned correctly</li>
              <li>• Take a few deep breaths to relax</li>
              <li>• Breaks will happen automatically</li>
            </ul>
          </div>

          {/* BEGIN BUTTON */}
          <Button
            variant="gradient"
            size="xl"
            className="w-full gap-2"
            onClick={handleBegin}
            disabled={loading}
          >
            <Play className="w-5 h-5" />
            {loading ? "Starting..." : "Begin Session"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Your data is collected for research purposes only and remains confidential.
        </p>
      </div>
    </div>
  );
}
