// src/components/Navbar.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-brand-link">
            <span className="nav-brand-icon">📝</span>
            <span className="nav-brand-text">My Blog</span>
          </Link>
        </div>

        <div className="nav-menu">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'nav-link--active' : ''}`}
          >
            <span className="nav-brand-icon">🏠</span>
            <span>홈</span>
          </Link>
          <Link
            to="/new"
            className={`nav-link ${isActive('/new') ? 'nav-link--active' : ''}`}
          >
            <span className="nav-brand-icon">✏️</span>
            <span>글쓰기</span>
          </Link>
        </div>

        <div className="nav-auth">
          {user ? (
            <div className="nav-user-menu">
              <div className="nav-user-info">
                <span className="nav-user-avatar">👤</span>
                <span className="nav-user-name">{user.username}</span>
              </div>
              <button onClick={logout} className="nav-logout-btn">
                로그아웃
              </button>
            </div>
          ) : (
            <div className="nav-auth-links">
              <Link to="/login" className="nav-auth-link nav-auth-link--login">
                로그인
              </Link>
              <Link to="/signup" className="nav-auth-link nav-auth-link--signup">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}