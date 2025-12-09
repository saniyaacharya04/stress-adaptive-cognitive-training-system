import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Play, User, Heart } from "lucide-react";
import { StressIndicatorDot } from "@/components/shared/StressIndicatorDot";
import { Link } from "react-router-dom";

export default function ParticipantHome() {
  const [participantId, setParticipantId] = useState("P-2024-0042");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        {/* Welcome Card */}
        <div className="glass-card p-8 space-y-6 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl primary-gradient shadow-glow animate-pulse-slow">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome to SACTS</h1>
            <p className="text-muted-foreground text-sm">
              Stress-Adaptive Cognitive Training System
            </p>
          </div>

          {/* Participant ID */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Your Participant ID
            </label>
            <Input
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="text-center text-lg font-mono"
              placeholder="Enter your ID"
            />
          </div>

          {/* Stress Indicator */}
          <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-calm-mint/30 border border-stress-low/20">
            <StressIndicatorDot level="low" />
            <span className="text-sm text-muted-foreground">
              Baseline stress level: <span className="font-medium text-stress-low">Normal</span>
            </span>
          </div>

          {/* Instructions */}
          <div className="text-left space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Before you begin
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Find a quiet, comfortable space</li>
              <li>• Ensure your camera is positioned correctly</li>
              <li>• Take a few deep breaths to relax</li>
              <li>• The session will include breaks for rest</li>
            </ul>
          </div>

          {/* Begin Button */}
          <Link to="/participant/nback">
            <Button variant="gradient" size="xl" className="w-full gap-2">
              <Play className="w-5 h-5" />
              Begin Session
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Your data is collected for research purposes only and remains confidential.
        </p>
      </div>
    </div>
  );
}
