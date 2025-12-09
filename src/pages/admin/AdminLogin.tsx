import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Lock, User, FlaskConical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate("/admin");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-6">
      <div className="max-w-md w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl primary-gradient shadow-glow">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sidebar-foreground">SACTS Research Portal</h1>
            <p className="text-sm text-sidebar-foreground/60 mt-1 flex items-center justify-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Secure Researcher Access
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl p-8 shadow-card">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="researcher@institution.edu"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-12"
              />
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-sidebar-foreground/40">
            Protected by institutional authentication
          </p>
          <p className="text-xs text-sidebar-foreground/40">
            IRB Protocol #2024-SACTS-001
          </p>
        </div>
      </div>
    </div>
  );
}
