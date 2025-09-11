import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login: setAuth } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };

  // 클라이언트 사이드 유효성 검증
  const validateInput = () => {
    const errors: string[] = [];
    
    if (!username || username.trim().length === 0) {
      errors.push("사용자명을 입력해주세요");
    }
    
    if (!password || password.length === 0) {
      errors.push("비밀번호를 입력해주세요");
    }
    
    return errors;
  };

  const mut = useMutation({
    mutationFn: async () => {
      console.log("로그인 요청 데이터:", { 
        username: username.trim(), 
        passwordLength: password.length 
      });
      
      // 클라이언트 사이드 유효성 검증
      const validationErrors = validateInput();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      const response = await login({ 
        username: username.trim(), 
        password 
      });
      
      console.log("로그인 성공:", { 
        userId: response.user.id, 
        username: response.user.username 
      });
      
      return response;
    },
    onSuccess: (data) => {
      // JWT 토큰과 사용자 정보를 AuthContext에 저장
      setAuth(data.token, data.user);
      
      // 기억하기 옵션 처리 (필요시)
      if (rememberMe) {
        // 추가적인 persistent 저장 로직 (선택사항)
        localStorage.setItem("rememberMe", "true");
      }
      
      nav(loc.state?.from ?? "/");
    },
    onError: (error: any) => {
      console.error("로그인 실패:", error);
      
      // 서버에서 온 상세한 에러 메시지 로깅
      if (error.response?.data?.message) {
        console.error("서버 에러 메시지:", error.response.data.message);
      }
    }
  });

  // 에러 메시지 표시 함수
  const getErrorMessage = () => {
    if (!mut.error) return null;
    
    const error = mut.error as any;
    
    // 클라이언트 사이드 에러
    if (error.message && !error.response) {
      return error.message;
    }
    
    // 서버 에러
    if (error.response?.status === 401) {
      return "아이디 또는 비밀번호가 올바르지 않습니다.";
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    return "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-page-header">
          <div className="auth-page-icon">🔐</div>
          <h1 className="auth-page-title">로그인</h1>
          <p className="auth-page-subtitle">계정에 로그인하여 블로그를 이용해보세요</p>
        </div>

        <div className="auth-page-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
            className="auth-page-form"
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
                disabled={mut.isPending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <div className="form-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete="current-password"
                  disabled={mut.isPending}
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  disabled={mut.isPending}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <div className="auth-remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={mut.isPending}
                />
                <label htmlFor="remember">로그인 상태 유지</label>
              </div>
              <a 
                href="#" 
                className="auth-forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: 비밀번호 찾기 기능 구현
                  alert("비밀번호 찾기 기능은 준비 중입니다.");
                }}
              >
                비밀번호 찾기
              </a>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={mut.isPending || !username.trim() || !password}
            >
              {mut.isPending ? (
                <>
                  <span className="ui-spinner-small"></span>
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </button>

            {mut.isError && (
              <div className="ui-error-message">
                <span>⚠️</span>
                {getErrorMessage()}
              </div>
            )}
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line"></div>
            <span className="auth-divider-text">또는</span>
            <div className="auth-divider-line"></div>
          </div>

          <div className="auth-social-login">
            <button 
              className="auth-social-btn" 
              type="button"
              onClick={() => alert("Google 로그인은 준비 중입니다.")}
              disabled={mut.isPending}
            >
              <span className="social-icon">🔵</span>
              <span>Google로 계속하기</span>
            </button>
            <button 
              className="auth-social-btn" 
              type="button"
              onClick={() => alert("GitHub 로그인은 준비 중입니다.")}
              disabled={mut.isPending}
            >
              <span className="social-icon">⚫</span>
              <span>GitHub로 계속하기</span>
            </button>
          </div>
        </div>

        <div className="auth-page-footer">
          <p className="auth-page-prompt">
            아직 계정이 없으신가요?{" "}
            <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}