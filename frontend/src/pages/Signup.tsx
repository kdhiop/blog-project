import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register, login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useConfirmModal } from "../components/ConfirmModal";

export function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { login: setAuth } = useAuth();
  const nav = useNavigate();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();

  // 클라이언트 사이드 유효성 검증 함수
  const validateInput = () => {
    const errors: string[] = [];
    
    if (!username || username.length < 3 || username.length > 20) {
      errors.push("사용자명은 3-20자 사이여야 합니다");
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push("사용자명은 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다");
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
    onSuccess: async (data) => {
      // JWT 토큰과 사용자 정보를 AuthContext에 저장
      setAuth(data.loginResponse.token, data.loginResponse.user);
      
      // 성공 메시지 표시
      await showConfirm({
        title: "회원가입 완료! 🎉",
        message: `환영합니다, ${data.user.username}님!\n\n이제 자유롭게 글을 작성하고 다른 사용자들과 소통할 수 있습니다.`,
        confirmText: "시작하기",
        type: "info"
      });
      
      nav("/");
    },
    onError: async (error: any) => {
      console.error("회원가입 실패:", error);
      
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      // 클라이언트 사이드 에러
      if (error.message && !error.response) {
        errorMessage = error.message;
      }
      // 서버 에러
      else if (error.response?.status === 400) {
        if (error.response.data?.message?.includes("already exists") || 
            error.response.data?.message?.includes("이미 존재")) {
          errorMessage = "이미 사용 중인 사용자명입니다. 다른 이름을 선택해주세요.";
        } else {
          errorMessage = error.response.data?.message || "입력 정보를 확인해주세요.";
        }
      }
      else if (error.response?.data?.fieldErrors) {
        const fieldErrors = error.response.data.fieldErrors;
        errorMessage = Object.values(fieldErrors).join(", ");
      }
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      await showConfirm({
        title: "회원가입 실패",
        message: errorMessage,
        confirmText: "확인",
        type: "danger"
      });
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

  const handleTermsClick = async () => {
    await showConfirm({
      title: "이용약관",
      message: "이용약관과 개인정보처리방침은 준비 중입니다.\n\n현재 테스트 버전으로 운영되고 있으며, 정식 서비스 시 제공될 예정입니다.",
      confirmText: "확인",
      type: "info"
    });
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
                pattern="[a-zA-Z0-9_]+"
                disabled={mut.isPending}
              />
              {username && (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) && (
                <span className="form-error-text">
                  {username.length < 3 || username.length > 20 
                    ? "사용자명은 3-20자 사이여야 합니다" 
                    : "영문, 숫자, 언더스코어(_)만 사용할 수 있습니다"
                  }
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
                  disabled={mut.isPending}
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  disabled={mut.isPending}
                  tabIndex={-1}
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
                disabled={mut.isPending}
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="form-error-text">
                  비밀번호가 일치하지 않습니다
                </span>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                <span style={{ color: "var(--success-color)", fontSize: "0.85rem", marginTop: "0.25rem", display: "block" }}>
                  ✓ 비밀번호가 일치합니다
                </span>
              )}
            </div>

            <div className="auth-terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={mut.isPending}
              />
              <label htmlFor="terms" className="auth-terms-label">
                <button 
                  type="button" 
                  onClick={handleTermsClick}
                  style={{ background: "none", border: "none", color: "var(--primary-color)", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit" }}
                >
                  이용약관
                </button> 및{" "}
                <button 
                  type="button" 
                  onClick={handleTermsClick}
                  style={{ background: "none", border: "none", color: "var(--primary-color)", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit" }}
                >
                  개인정보처리방침
                </button>에 동의합니다
              </label>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={
                mut.isPending || 
                !agreedToTerms || 
                password !== confirmPassword || 
                username.length < 3 || 
                password.length < 6 ||
                !/^[a-zA-Z0-9_]+$/.test(username)
              }
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
      
      {/* 커스텀 모달 컴포넌트 */}
      <ConfirmModalComponent />
    </div>
  );
}