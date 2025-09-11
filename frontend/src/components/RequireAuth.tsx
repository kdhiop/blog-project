import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface RequireAuthProps {
  children?: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps = {}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="ui-loading-container">
        <div className="ui-spinner"></div>
        <p className="ui-loading-text">인증 확인 중...</p>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // children이 있으면 children을 렌더링, 없으면 Outlet 렌더링
  return children ? <>{children}</> : <Outlet />;
}