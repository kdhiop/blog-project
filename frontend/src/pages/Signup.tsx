import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { login } = useAuth();
  const nav = useNavigate();

  const mut = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다");
      }
      const user = await register({ username, password });
      login(user);
    },
    onSuccess: () => nav("/"),
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

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <div className="signup-icon">✨</div>
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">블로그 커뮤니티에 가입하세요</p>
        </div>

        <div className="signup-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!agreedToTerms) {
                alert("이용약관에 동의해주세요");
                return;
              }
              mut.mutate();
            }}
            className="signup-form"
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
                placeholder="사용할 아이디를 입력하세요"
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
                  autoComplete="new-password"
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
              
              {password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div className={`strength-fill ${passwordStrength}`}></div>
                  </div>
                  <span className="strength-text">
                    비밀번호 강도: {
                      passwordStrength === "weak" ? "약함" :
                      passwordStrength === "medium" ? "보통" : "강함"
                    }
                  </span>
                </div>
              )}

              <div className="password-requirements">
                <div className={`requirement ${password.length >= 8 ? "met" : ""}`}>
                  <span className="requirement-icon">
                    {password.length >= 8 ? "✓" : "○"}
                  </span>
                  <span>최소 8자 이상</span>
                </div>
                <div className={`requirement ${/[A-Z]/.test(password) ? "met" : ""}`}>
                  <span className="requirement-icon">
                    {/[A-Z]/.test(password) ? "✓" : "○"}
                  </span>
                  <span>대문자 포함</span>
                </div>
                <div className={`requirement ${/[0-9]/.test(password) ? "met" : ""}`}>
                  <span className="requirement-icon">
                    {/[0-9]/.test(password) ? "✓" : "○"}
                  </span>
                  <span>숫자 포함</span>
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
                <span style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  비밀번호가 일치하지 않습니다
                </span>
              )}
            </div>

            <div className="terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="terms-label">
                <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의합니다
              </label>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={mut.isPending || !agreedToTerms}
            >
              {mut.isPending ? "가입 중..." : "회원가입"}
            </button>

            {mut.isError && (
              <div className="error-message">
                회원가입에 실패했습니다. {mut.error?.message || "이미 사용 중인 아이디일 수 있습니다."}
              </div>
            )}
          </form>

          <div className="signup-benefits">
            <p className="benefits-title">회원가입 혜택</p>
            <div className="benefit-item">
              <span className="benefit-icon">✍️</span>
              <span>자유로운 글 작성 및 공유</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">💬</span>
              <span>다른 사용자와 댓글로 소통</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">📚</span>
              <span>나만의 블로그 포트폴리오 구축</span>
            </div>
          </div>
        </div>

        <div className="signup-footer">
          <p className="login-prompt">
            이미 계정이 있으신가요?
            <Link to="/login" className="login-link">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}