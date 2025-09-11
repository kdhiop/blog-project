import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewPost from "./pages/NewPost";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RequireAuth from "./components/RequireAuth";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { type ReactNode } from "react";

// 타입 정의 추가
interface ShellProps {
  children: ReactNode;
}

interface ProtectedRouteProps {
  children: ReactNode;
}

function Shell({ children }: ShellProps) {
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <Navbar />
        <main className="main-content">{children}</main>
      </div>
    </ErrorBoundary>
  );
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <Shell>
      <RequireAuth>
        {children}
      </RequireAuth>
    </Shell>
  );
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Shell><Home /></Shell>} />
      <Route path="/posts/:id" element={<Shell><PostDetail /></Shell>} />
      <Route path="/login" element={<Shell><Login /></Shell>} />
      <Route path="/signup" element={<Shell><Signup /></Shell>} />
      <Route path="/new" element={<ProtectedRoute><NewPost /></ProtectedRoute>} />
      
      {/* 404 처리 */}
      <Route path="*" element={
        <Shell>
          <div className="ui-error-container">
            <span className="ui-error-icon">🔍</span>
            <h2>페이지를 찾을 수 없습니다</h2>
            <p>요청하신 페이지가 존재하지 않습니다.</p>
            <a href="/" className="ui-btn ui-btn-primary">홈으로 돌아가기</a>
          </div>
        </Shell>
      } />
    </>
  )
);