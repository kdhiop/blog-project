import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const mut = useMutation({
    mutationFn: async () => {
      const user = await register({ username, password });
      login(user); // 회원가입 후 자동 로그인
    },
    onSuccess: () => nav("/"),
  });

  return (
    <div style={{ padding: 16 }}>
      <h1>Signup</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        style={{ display: "grid", gap: 8, maxWidth: 400 }}
      >
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit" disabled={mut.isPending}>Create Account</button>
        {mut.isError && <div style={{ color: "crimson" }}>회원가입 실패 (중복 아이디?)</div>}
      </form>
    </div>
  );
}
