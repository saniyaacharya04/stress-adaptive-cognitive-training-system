import { useState } from "react";
import { adminLogin } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const res = await adminLogin(username, password);
      if (res.ok) {
        localStorage.setItem("admin_token", res.data.token);
        nav("/admin");
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="p-8 bg-white rounded-xl shadow-md space-y-4 w-96">
        <h1 className="text-xl font-bold text-center">Admin Login</h1>

        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button onClick={handleLogin} className="w-full">
          Login
        </Button>
      </div>
    </div>
  );
}
