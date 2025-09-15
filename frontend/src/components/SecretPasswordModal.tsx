import { useState, useEffect } from 'react';

interface SecretPasswordModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function SecretPasswordModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isLoading = false,
  error
}: SecretPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() && !isLoading) {
      onConfirm(password.trim());
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="confirm-modal-overlay confirm-modal-overlay--active"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="confirm-modal confirm-modal--active"
        role="dialog"
        aria-modal="true"
        aria-labelledby="secret-modal-title"
      >
        {/* Header */}
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon" style={{ color: "#f59e0b" }}>
            🔒
          </div>
          <h3 id="secret-modal-title" className="confirm-modal-title">
            비밀글 접근
          </h3>
        </div>

        {/* Body */}
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">
            "{title}" 게시글은 비밀글입니다.
            <br />
            비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleSubmit} className="secret-password-form">
            <div className="secret-password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="secret-password-input"
                disabled={isLoading}
                autoFocus
                maxLength={50}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="secret-password-toggle"
                disabled={isLoading}
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {error && (
              <div className="secret-password-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="confirm-modal-btn confirm-modal-btn--cancel"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={!password.trim() || isLoading}
            className="confirm-modal-btn confirm-modal-btn--confirm confirm-modal-btn--warning"
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                확인 중...
              </>
            ) : (
              '확인'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}