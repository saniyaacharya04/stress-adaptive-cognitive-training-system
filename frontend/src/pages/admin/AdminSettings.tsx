import { useState } from "react";
import { changeAdminPassword } from "@/api/admin";

export default function AdminSettings() {
  const [username, setUsername] = useState("admin");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    try {
      const res = await changeAdminPassword(username, newPassword);
      if (res?.ok) {
        setMsg("Password updated");
      } else {
        setMsg("Failed: " + (res?.error || "unknown"));
      }
    } catch (e) {
      setMsg("Error updating password");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">Admin Settings</h1>

      <div className="glass-card p-4 max-w-md">
        <label className="text-sm">Username</label>
        <input className="input mt-1" value={username} onChange={(e)=>setUsername(e.target.value)} />

        <label className="text-sm mt-2">New Password</label>
        <input type="password" className="input mt-1" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />

        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={submit}>Change Password</button>
        </div>

        {msg && <div className="text-sm text-muted-foreground mt-2">{msg}</div>}
      </div>
    </div>
  );
}
