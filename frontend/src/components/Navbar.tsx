import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [navSearchQuery, setNavSearchQuery] = useState("");

  const isActive = (path: string) => location.pathname === path;

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim().length >= 2) {
      const searchParams = new URLSearchParams();
      searchParams.set('search', navSearchQuery.trim());
      navigate(`/?${searchParams.toString()}`);
      setNavSearchQuery("");
    }
  };

  const handleNavSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNavSearchQuery(e.target.value);
  };

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

        {/* Navigation Search - Desktop Only */}
        <div className="nav-search-container">
          <form onSubmit={handleNavSearch} className="nav-search-form">
            <input
              type="text"
              value={navSearchQuery}
              onChange={handleNavSearchChange}
              placeholder="검색..."
              className="nav-search-input"
              maxLength={50}
            />
          </form>
        </div>

        <div className="nav-auth">
          {isLoading ? (
            <div className="nav-user-info">
              <div className="ui-spinner-small"></div>
              <span>로딩...</span>
            </div>
          ) : user ? (
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