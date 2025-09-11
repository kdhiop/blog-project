import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { User } from "../api/auth";
import { getCurrentUser } from "../api/auth";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 토큰 및 사용자 정보 저장
  const login = useCallback((token: string, userData: User) => {
    try {
      localStorage.setItem("auth:token", token);
      localStorage.setItem("auth:user", JSON.stringify(userData));
      setUser(userData);
      
      if (import.meta.env.DEV) {
        console.log("사용자 로그인 완료:", userData.username);
      }
    } catch (error) {
      console.error("로그인 정보 저장 실패:", error);
      // localStorage가 사용 불가능한 경우 메모리에만 저장
      setUser(userData);
    }
  }, []);

  // 로그아웃
  const logout = useCallback(() => {
    try {
      localStorage.removeItem("auth:token");
      localStorage.removeItem("auth:user");
    } catch (error) {
      console.warn("로그아웃 시 localStorage 정리 실패:", error);
    }
    setUser(null);
    
    if (import.meta.env.DEV) {
      console.log("사용자 로그아웃 완료");
    }
  }, []);

  // 사용자 정보 업데이트
  const updateUser = useCallback((userData: User) => {
    try {
      localStorage.setItem("auth:user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.warn("사용자 정보 업데이트 실패:", error);
      setUser(userData);
    }
  }, []);

  // 토큰 유효성 검증
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth:token");
      
      if (!token) {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // 서버에서 현재 사용자 정보 검증
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // 로컬 스토리지 사용자 정보 업데이트
      localStorage.setItem("auth:user", JSON.stringify(currentUser));
      
      if (import.meta.env.DEV) {
        console.log("토큰 검증 성공:", currentUser.username);
      }
    } catch (error) {
      console.error("토큰 검증 실패:", error);
      // 토큰이 유효하지 않으면 로그아웃
      logout();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [logout]);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo<AuthState>(() => ({
    user,
    isLoading,
    isInitialized,
    login,
    logout,
    checkAuth,
    updateUser,
  }), [user, isLoading, isInitialized, login, logout, checkAuth, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};