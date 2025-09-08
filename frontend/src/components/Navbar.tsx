import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">📝</span>
            <span className="brand-text">My Blog</span>
          </Link>
        </div>

        <div className="navbar-menu">
          <Link 
            to="/" 
            className={`navbar-link ${isActive('/') ? 'active' : ''}`}
          >
            <span className="link-icon">🏠</span>
            <span>홈</span>
          </Link>
          <Link 
            to="/new" 
            className={`navbar-link ${isActive('/new') ? 'active' : ''}`}
          >
            <span className="link-icon">✏️</span>
            <span>글쓰기</span>
          </Link>
        </div>

        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-avatar">👤</span>
                <span className="user-name">{user.username}</span>
              </div>
              <button onClick={logout} className="logout-btn">
                로그아웃
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-link login-link">
                로그인
              </Link>
              <Link to="/signup" className="auth-link signup-link">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}