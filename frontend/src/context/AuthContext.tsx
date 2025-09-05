import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../api/auth";

type AuthState = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // 새로고침 복구
  useEffect(() => {
    const raw = localStorage.getItem("auth:user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("auth:user");
      }
    }
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    login: (u) => {
      setUser(u);
      localStorage.setItem("auth:user", JSON.stringify(u));
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem("auth:user");
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
