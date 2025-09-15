import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import Home from "./pages/Home";
import PostsPage from "./pages/PostsPage"; // 새 페이지 추가
import NewPost from "./pages/NewPost";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import { Signup } from "./pages/Signup";
import RequireAuth from "./components/RequireAuth";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { type ReactNode } from "react";

// 타입 정의 추가
interface ShellProps {
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

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* 메인 홈 페이지 */}
      <Route path="/" element={<Shell><Home /></Shell>} />
      
      {/* 게시글 전체 목록 페이지 - 새로 추가 */}
      <Route path="/posts" element={<Shell><PostsPage /></Shell>} />
      
      {/* 게시글 상세 페이지 */}
      <Route path="/posts/:id" element={<Shell><PostDetail /></Shell>} />
      
      {/* 인증 관련 페이지 */}
      <Route path="/login" element={<Shell><Login /></Shell>} />
      <Route path="/signup" element={<Shell><Signup /></Shell>} />
      
      {/* 보호된 라우트 - 글쓰기 */}
      <Route path="/new" element={
        <Shell>
          <RequireAuth />
        </Shell>
      }>
        {/* 중첩 라우트로 NewPost 컴포넌트 배치 */}
        <Route index element={<NewPost />} />
      </Route>
      
      {/* 404 처리 */}
      <Route path="*" element={
        <Shell>
          <div className="ui-error-container">
            <span className="ui-error-icon">🔍</span>
            <h2>페이지를 찾을 수 없습니다</h2>
            <p>요청하신 페이지가 존재하지 않습니다.</p>
            <div className="ui-error-actions">
              <button 
                onClick={() => window.history.back()} 
                className="ui-btn ui-btn-secondary"
                style={{ marginRight: '1rem' }}
              >
                이전 페이지
              </button>
              <a href="/" className="ui-btn ui-btn-primary">
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </Shell>
      } />
    </>
  )
);