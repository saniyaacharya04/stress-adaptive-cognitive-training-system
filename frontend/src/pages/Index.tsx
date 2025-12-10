import { Button } from "@/components/ui/button";
import { Brain, Users, FlaskConical, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center calm-gradient relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8 animate-fade-in-up">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl primary-gradient shadow-glow">
              <Brain className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Stress-Adaptive</span>
              <br />
              Cognitive Training System
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A research-grade platform for adaptive cognitive assessment with real-time 
              physiological monitoring and intelligent difficulty adjustment.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">3</p>
              <p className="text-sm text-muted-foreground">Task Types</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">Real-time</p>
              <p className="text-sm text-muted-foreground">Stress Monitoring</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">PID</p>
              <p className="text-sm text-muted-foreground">Adaptive Control</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/participant">
              <Button variant="gradient" size="xl" className="gap-2 min-w-[200px]">
                <Users className="w-5 h-5" />
                Participant Portal
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="outline" size="xl" className="gap-2 min-w-[200px]">
                <FlaskConical className="w-5 h-5" />
                Researcher Access
              </Button>
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground pt-8">
            Designed for research environments · MIT Media Lab · Stanford HCI · CMU HCII inspired
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
