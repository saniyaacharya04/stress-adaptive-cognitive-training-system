import { Button } from "@/components/ui/button";
import { Trophy, Clock, Target, TrendingUp, Home, RotateCcw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function SessionComplete() {
  const location = useLocation();
  const reactionTimes = location.state?.reactionTimes || [];
  
  // Mock session data
  const sessionStats = {
    totalTrials: 45,
    overallAccuracy: 87,
    avgReactionTime: reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a: number, b: number) => a + b, 0) / reactionTimes.length)
      : 423,
    peakDifficulty: 4,
    totalDuration: "12:34",
    stressManagement: "Excellent",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Celebration background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-calm-lavender/50 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-calm-mint/50 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl primary-gradient shadow-glow animate-pulse-slow">
              <Trophy className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Session Complete!</h1>
          <p className="text-lg text-muted-foreground">
            Great work! Here's a summary of your cognitive performance.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-stress-low">{sessionStats.overallAccuracy}%</p>
            <p className="text-sm text-muted-foreground">Accuracy</p>
          </div>
          
          <div className="glass-card p-5 text-center">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-3xl font-bold font-mono">{sessionStats.avgReactionTime}ms</p>
            <p className="text-sm text-muted-foreground">Avg Reaction</p>
          </div>
          
          <div className="glass-card p-5 text-center">
            <TrendingUp className="w-6 h-6 text-stress-low mx-auto mb-2" />
            <p className="text-3xl font-bold">Level {sessionStats.peakDifficulty}</p>
            <p className="text-sm text-muted-foreground">Peak Difficulty</p>
          </div>
          
          <div className="glass-card p-5 text-center">
            <p className="text-3xl font-bold">{sessionStats.totalTrials}</p>
            <p className="text-sm text-muted-foreground">Total Trials</p>
          </div>
          
          <div className="glass-card p-5 text-center">
            <p className="text-3xl font-bold font-mono">{sessionStats.totalDuration}</p>
            <p className="text-sm text-muted-foreground">Session Time</p>
          </div>
          
          <div className="glass-card p-5 text-center">
            <p className="text-2xl font-bold text-stress-low">{sessionStats.stressManagement}</p>
            <p className="text-sm text-muted-foreground">Stress Mgmt</p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="glass-card p-6 text-center border-primary/20">
          <p className="text-lg font-medium mb-2">🌟 Outstanding Performance!</p>
          <p className="text-muted-foreground">
            Your cognitive flexibility improved throughout the session. 
            The adaptive system successfully maintained optimal challenge levels 
            while keeping your stress within healthy bounds.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/participant">
            <Button variant="outline" size="lg" className="gap-2 min-w-[180px]">
              <RotateCcw className="w-5 h-5" />
              New Session
            </Button>
          </Link>
          <Link to="/">
            <Button variant="gradient" size="lg" className="gap-2 min-w-[180px]">
              <Home className="w-5 h-5" />
              End Session
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Thank you for participating in this research study.
          Your data has been securely recorded.
        </p>
      </div>
    </div>
  );
}
