import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchUserByUsername, login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">계정에 로그인하여 블로그를 이용해보세요</p>
        </div>

        <div className="login-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
            className="login-form"
          >
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                사용자명
              </label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="사용자명을 입력하세요"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">로그인 상태 유지</label>
              </div>
              <a href="#" className="forgot-password">
                비밀번호 찾기
              </a>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={mut.isPending}
            >
              {mut.isPending ? "로그인 중..." : "로그인"}
            </button>

            {mut.isError && (
              <div className="error-message">
                로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.
              </div>
            )}
          </form>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">또는</span>
            <div className="divider-line"></div>
          </div>

          <div className="social-login">
            <button className="social-btn" type="button">
              <span className="social-icon">🔵</span>
              <span>Google로 계속하기</span>
            </button>
            <button className="social-btn" type="button">
              <span className="social-icon">⚫</span>
              <span>GitHub로 계속하기</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p className="signup-prompt">
            아직 계정이 없으신가요?
            <Link to="/signup" className="signup-link">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}