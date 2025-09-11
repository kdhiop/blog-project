import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register, login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { login: setAuth } = useAuth();
  const nav = useNavigate();

  // 클라이언트 사이드 유효성 검증 함수
  const validateInput = () => {
    const errors: string[] = [];
    
    if (!username || username.length < 3 || username.length > 20) {
      errors.push("사용자명은 3-20자 사이여야 합니다");
    }
    
    if (!password || password.length < 6) {
      errors.push("비밀번호는 6자 이상이어야 합니다");
    }
    
    if (password !== confirmPassword) {
      errors.push("비밀번호가 일치하지 않습니다");
    }
    
    if (!agreedToTerms) {
      errors.push("이용약관에 동의해주세요");
    }
    
    return errors;
  };

  const mut = useMutation({
    mutationFn: async () => {
      console.log("회원가입 요청 데이터:", { 
        username, 
        passwordLength: password.length,
        confirmPasswordMatch: password === confirmPassword 
      });
      
      // 클라이언트 사이드 유효성 검증
      const validationErrors = validateInput();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // 1. 회원가입
      const user = await register({ username, password });
      console.log("회원가입 성공:", user);

      // 2. 바로 로그인하여 토큰 받기
      const loginResponse = await login({ username, password });
      console.log("자동 로그인 성공:", loginResponse);

      return { user, loginResponse };
    },
    onSuccess: (data) => {
      // JWT 토큰과 사용자 정보를 AuthContext에 저장
      setAuth(data.loginResponse.token, data.loginResponse.user);
      nav("/");
    },
    onError: (error: any) => {
      console.error("회원가입 실패:", error);
      
      // 서버에서 온 상세한 에러 메시지 추출
      if (error.response?.data?.message) {
        console.error("서버 에러 메시지:", error.response.data.message);
      } else if (error.response?.data?.fieldErrors) {
        console.error("필드 검증 에러:", error.response.data.fieldErrors);
      }
    }
  });

  // 비밀번호 강도 체크
  const getPasswordStrength = () => {
    if (!password) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return "weak";
    if (strength <= 2) return "medium";
    return "strong";
  };

  const passwordStrength = getPasswordStrength();

  // 에러 메시지 표시 함수
  const getErrorMessage = () => {
    if (!mut.error) return null;
    
    const error = mut.error as any;
    
    // 클라이언트 사이드 에러
    if (error.message && !error.response) {
      return error.message;
    }
    
    // 서버 에러
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // 필드 검증 에러
    if (error.response?.data?.fieldErrors) {
      const fieldErrors = error.response.data.fieldErrors;
      return Object.values(fieldErrors).join(", ");
    }
    
    // 기본 에러 메시지
    if (error.response?.status === 400) {
      return "입력 정보를 확인해주세요. 이미 사용 중인 아이디일 수 있습니다.";
    }
    
    return "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-page-header">
          <div className="auth-page-icon">✨</div>
          <h1 className="auth-page-title">회원가입</h1>
          <p className="auth-page-subtitle">블로그 커뮤니티에 가입하세요</p>
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
                placeholder="사용할 아이디를 입력하세요 (3-20자)"
                required
                autoComplete="username"
                minLength={3}
                maxLength={20}
              />
              {username && (username.length < 3 || username.length > 20) && (
                <span className="form-error-text">
                  사용자명은 3-20자 사이여야 합니다
                </span>
              )}
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
                  placeholder="비밀번호를 입력하세요 (6자 이상)"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              {password && (
                <div className="auth-password-strength">
                  <div className="auth-strength-bar">
                    <div className={`auth-strength-fill auth-strength-fill--${passwordStrength}`}></div>
                  </div>
                  <span className="auth-strength-text">
                    비밀번호 강도: {
                      passwordStrength === "weak" ? "약함" :
                        passwordStrength === "medium" ? "보통" : "강함"
                    }
                  </span>
                </div>
              )}

              <div className="auth-password-requirements">
                <div className={`auth-requirement ${password.length >= 6 ? "auth-requirement--met" : ""}`}>
                  <span className="auth-requirement-icon">
                    {password.length >= 6 ? "✓" : "○"}
                  </span>
                  <span>최소 6자 이상</span>
                </div>
                <div className={`auth-requirement ${/[A-Z]/.test(password) ? "auth-requirement--met" : ""}`}>
                  <span className="auth-requirement-icon">
                    {/[A-Z]/.test(password) ? "✓" : "○"}
                  </span>
                  <span>대문자 포함 (권장)</span>
                </div>
                <div className={`auth-requirement ${/[0-9]/.test(password) ? "auth-requirement--met" : ""}`}>
                  <span className="auth-requirement-icon">
                    {/[0-9]/.test(password) ? "✓" : "○"}
                  </span>
                  <span>숫자 포함 (권장)</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="form-error-text">
                  비밀번호가 일치하지 않습니다
                </span>
              )}
            </div>

            <div className="auth-terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="auth-terms-label">
                <a href="#" onClick={(e) => e.preventDefault()}>이용약관</a> 및{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>개인정보처리방침</a>에 동의합니다
              </label>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={mut.isPending || !agreedToTerms || password !== confirmPassword || username.length < 3 || password.length < 6}
            >
              {mut.isPending ? (
                <>
                  <span className="ui-spinner-small"></span>
                  가입 중...
                </>
              ) : (
                "회원가입"
              )}
            </button>

            {mut.isError && (
              <div className="ui-error-message">
                <span>⚠️</span>
                {getErrorMessage()}
              </div>
            )}
          </form>

          <div className="auth-signup-benefits">
            <p className="auth-benefits-title">회원가입 혜택</p>
            <div className="auth-benefit-item">
              <span className="auth-benefit-icon">✍️</span>
              <span>자유로운 글 작성 및 공유</span>
            </div>
            <div className="auth-benefit-item">
              <span className="auth-benefit-icon">💬</span>
              <span>다른 사용자와 댓글로 소통</span>
            </div>
            <div className="auth-benefit-item">
              <span className="auth-benefit-icon">📚</span>
              <span>나만의 블로그 포트폴리오 구축</span>
            </div>
          </div>
        </div>

        <div className="auth-page-footer">
          <p className="auth-page-prompt">
            이미 계정이 있으신가요?
            <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}