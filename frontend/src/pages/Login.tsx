import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchUserByUsername, login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login: setAuth } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };

  const mut = useMutation({
    mutationFn: async () => {
      const ok = await login({ username, password });
      if (!ok) throw new Error("login failed");
      const user = await fetchUserByUsername(username);
      setAuth(user);
    },
    onSuccess: () => {
      nav(loc.state?.from ?? "/");
    },
  });

  return (
    <div style={{ padding: 16 }}>
      <h1>Login</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        style={{ display: "grid", gap: 8, maxWidth: 400 }}
      >
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit" disabled={mut.isPending}>Login</button>
        {mut.isError && <div style={{ color: "crimson" }}>로그인 실패</div>}
      </form>
    </div>
  );
}
