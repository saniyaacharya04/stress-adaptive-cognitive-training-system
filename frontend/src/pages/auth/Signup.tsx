import { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    await axios.post("/api/auth/signup", { email, password });
    alert("Signup successful");
  }

  return (
    <div>
      <h2>Signup</h2>
      <input placeholder="email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={submit}>Signup</button>
    </div>
  );
}
