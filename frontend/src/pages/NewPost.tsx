import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useConfirmModal } from "../components/ConfirmModal";

export default function NewPost() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");
  const [showSecretPassword, setShowSecretPassword] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 변경사항 감지
  useEffect(() => {
    setHasUnsavedChanges(
      title.trim().length > 0 ||
      content.trim().length > 0 ||
      isSecret ||
      secretPassword.trim().length > 0
    );
  }, [title, content, isSecret, secretPassword]);

  // 페이지 벗어날 때 경고 (브라우저 기본)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const mut = useMutation({
    mutationFn: () => {
      if (!title.trim()) {
        throw new Error("제목을 입력해주세요.");
      }
      if (!content.trim()) {
        throw new Error("내용을 입력해주세요.");
      }
      if (title.trim().length < 2) {
        throw new Error("제목은 2자 이상 입력해주세요.");
      }
      if (content.trim().length < 10) {
        throw new Error("내용은 10자 이상 입력해주세요.");
      }
      if (isSecret && !secretPassword.trim()) {
        throw new Error("비밀글에는 비밀번호가 필요합니다.");
      }

      return createPost({
        title: title.trim(),
        content: content.trim(),
        isSecret,
        secretPassword: isSecret ? secretPassword.trim() : undefined
      });
    },
    onSuccess: (newPost) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      setHasUnsavedChanges(false);
      nav(`/posts/${newPost.id}`);
    },
    onError: async (error: any) => {
      console.error("게시글 작성 실패:", error);

      let errorMessage = "게시글 작성에 실패했습니다.";

      if (error.message && !error.response) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "로그인이 필요합니다.";
      } else if (error.response?.status === 403) {
        errorMessage = "권한이 없습니다.";
      }

      await showConfirm({
        title: "작성 실패",
        message: errorMessage,
        confirmText: "확인",
        type: "danger",
        showCancel: false
      });
    }
  });

  const handleCancel = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await showConfirm({
        title: "작성 취소",
        message: "작성 중인 내용이 있습니다.\n정말로 취소하시겠습니까?\n\n저장되지 않은 내용은 모두 사라집니다.",
        confirmText: "취소하기",
        cancelText: "계속 작성",
        type: "warning"
      });

      if (!confirmed) return;
    }

    nav("/");
  };

  const handleSecretToggle = (checked: boolean) => {
    if (checked) {
      setIsSecret(true);
    } else {
      setIsSecret(false);
      setSecretPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검증
    if (!title.trim()) {
      await showConfirm({
        title: "입력 확인",
        message: "제목을 입력해주세요.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }

    if (!content.trim()) {
      await showConfirm({
        title: "입력 확인",
        message: "내용을 입력해주세요.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }

    if (title.trim().length < 2) {
      await showConfirm({
        title: "입력 확인",
        message: "제목은 2자 이상 입력해주세요.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }

    if (content.trim().length < 10) {
      await showConfirm({
        title: "입력 확인",
        message: "내용은 10자 이상 입력해주세요.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }

    if (isSecret && !secretPassword.trim()) {
      await showConfirm({
        title: "비밀번호 필요",
        message: "비밀글에는 비밀번호가 필요합니다.\n비밀번호를 입력해주세요.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }

    // 발행 확인
    const postType = isSecret ? "비밀글" : "게시글";
    let confirmMessage = `"${title.trim()}"을(를) ${postType}로 발행하시겠습니까?\n\n발행 후에도 수정할 수 있습니다.`;

    if (isSecret) {
      confirmMessage += `\n\n🔐 이 게시글은 비밀번호를 아는 사용자만 볼 수 있습니다.`;
    }

    const confirmed = await showConfirm({
      title: `${postType} 발행`,
      message: confirmMessage,
      confirmText: "발행하기",
      cancelText: "취소",
      type: "info"
    });

    if (confirmed) {
      mut.mutate();
    }
  };

  const handlePreviewToggle = async () => {
    if (!title.trim() && !content.trim()) {
      await showConfirm({
        title: "미리보기 불가",
        message: "제목과 내용을 입력한 후 미리보기를 사용할 수 있습니다.",
        confirmText: "확인",
        type: "info",
        showCancel: false
      });
      return;
    }
    setIsPreview(!isPreview);
  };

  const charCount = content.length;
  const maxChars = 2000;

  // 인증되지 않은 사용자 처리
  if (!user) {
    return (
      <div className="new-post-container">
        <div className="ui-error-container">
          <span className="ui-error-icon">🔒</span>
          <h2>로그인이 필요합니다</h2>
          <p>게시글을 작성하려면 먼저 로그인해주세요.</p>
          <button
            onClick={() => nav("/login")}
            className="ui-btn ui-btn-primary"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-post-container">
      <div className="new-post-wrapper">
        <div className="new-post-card">
          <div className="new-post-header">
            <div className="new-post-header-content">
              <div className="new-post-header-title">
                <div className="new-post-header-icon">
                  {isSecret ? "🔐" : "✍️"}
                </div>
                <div className="new-post-header-text">
                  <h1>{isSecret ? "비밀글 작성" : "새 글 작성"}</h1>
                  <p>
                    {hasUnsavedChanges
                      ? (isSecret ? "비밀글 작성 중..." : "작성 중...")
                      : "당신의 이야기를 공유해보세요"
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="new-post-cancel-btn"
                disabled={mut.isPending}
              >
                {hasUnsavedChanges ? "취소" : "나가기"}
              </button>
            </div>
          </div>

          <div className="new-post-body">
            {!isPreview ? (
              <form onSubmit={handleSubmit} className="new-post-form">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    <span className="form-label-icon">📌</span>
                    제목
                    <span className="form-required">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="form-input"
                    placeholder="독자의 관심을 끌 수 있는 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={100}
                    disabled={mut.isPending}
                  />
                  {title.length > 0 && (
                    <div className={`form-char-count ${title.length > 90 ? 'form-char-count--warning' : ''} ${title.length >= 100 ? 'form-char-count--error' : ''}`}>
                      {title.length} / 100
                    </div>
                  )}
                </div>

                {/* 비밀글 설정 */}
                <div className="form-group">
                  <div className="secret-post-toggle">
                    <label className="secret-toggle-label">
                      <input
                        type="checkbox"
                        checked={isSecret}
                        onChange={(e) => handleSecretToggle(e.target.checked)}
                        disabled={mut.isPending}
                        className="secret-toggle-input"
                      />
                      <div className="secret-toggle-switch">
                        <div className="secret-toggle-slider"></div>
                      </div>
                      <span className="secret-toggle-text">
                        <span className="secret-toggle-icon">{isSecret ? "🔐" : "🔓"}</span>
                        <span>비밀글로 설정</span>
                      </span>
                    </label>
                    {isSecret && (
                      <div className="secret-toggle-hint">
                        비밀번호를 아는 사용자만 이 게시글을 볼 수 있습니다
                      </div>
                    )}
                  </div>
                </div>

                {/* 비밀글 비밀번호 */}
                {isSecret && (
                  <div className="form-group">
                    <label htmlFor="secretPassword" className="form-label">
                      <span className="form-label-icon">🔑</span>
                      비밀글 비밀번호
                      <span className="form-required">*</span>
                    </label>
                    <div className="secret-password-input-container">
                      <input
                        id="secretPassword"
                        type={showSecretPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="비밀글을 보기 위한 비밀번호를 입력하세요"
                        value={secretPassword}
                        onChange={(e) => setSecretPassword(e.target.value)}
                        required={isSecret}
                        maxLength={50}
                        disabled={mut.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretPassword(!showSecretPassword)}
                        className="secret-password-toggle-btn"
                        disabled={mut.isPending}
                        title={showSecretPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showSecretPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    {secretPassword.length > 0 && (
                      <div className={`form-char-count ${secretPassword.length > 45 ? 'form-char-count--warning' : ''} ${secretPassword.length >= 50 ? 'form-char-count--error' : ''}`}>
                        {secretPassword.length} / 50
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="content" className="form-label">
                    <span className="form-label-icon">📝</span>
                    내용
                    <span className="form-required">*</span>
                  </label>

                  <div className="new-post-toolbar">
                    <button type="button" className="new-post-toolbar-btn" title="굵게" disabled>
                      <strong>B</strong>
                    </button>
                    <button type="button" className="new-post-toolbar-btn" title="기울임" disabled>
                      <em>I</em>
                    </button>
                    <button type="button" className="new-post-toolbar-btn" title="밑줄" disabled>
                      <u>U</u>
                    </button>
                    <div className="new-post-toolbar-separator"></div>
                    <button type="button" className="new-post-toolbar-btn" title="목록" disabled>
                      📋
                    </button>
                    <button type="button" className="new-post-toolbar-btn" title="링크" disabled>
                      🔗
                    </button>
                    <button type="button" className="new-post-toolbar-btn" title="이미지" disabled>
                      🖼️
                    </button>
                    <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-light)" }}>
                      준비 중
                    </div>
                  </div>

                  <textarea
                    id="content"
                    className="form-input form-textarea new-post-textarea--with-toolbar"
                    placeholder="여기에 당신의 생각, 아이디어, 이야기를 자유롭게 작성해보세요.&#10;&#10;팁:&#10;- 단락 구분을 위해 빈 줄을 활용하세요&#10;- 독자가 이해하기 쉽게 구조적으로 작성하세요&#10;- 개인정보나 민감한 정보는 포함하지 마세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    maxLength={maxChars}
                    disabled={mut.isPending}
                    rows={15}
                  />
                  <div className={`form-char-count ${charCount > maxChars * 0.9 ? 'form-char-count--warning' : ''} ${charCount >= maxChars ? 'form-char-count--error' : ''}`}>
                    {charCount} / {maxChars}
                    {charCount < 10 && (
                      <span style={{ color: "var(--warning-color)", marginLeft: "0.5rem" }}>
                        (최소 10자 필요)
                      </span>
                    )}
                  </div>
                </div>

                <div className="new-post-form-footer">
                  <div className="new-post-draft-info">
                    <span>💾</span>
                    <span>
                      {hasUnsavedChanges ? "변경사항이 있습니다" : "변경사항 없음"}
                    </span>
                    {isSecret && (
                      <span className="secret-post-indicator">
                        🔐 비밀글
                      </span>
                    )}
                  </div>

                  <div className="new-post-form-actions">
                    <button
                      type="button"
                      onClick={handlePreviewToggle}
                      className="ui-btn ui-btn-secondary"
                      disabled={mut.isPending}
                    >
                      <span>👀</span>
                      미리보기
                    </button>
                    <button
                      type="submit"
                      className="ui-btn ui-btn-primary"
                      disabled={mut.isPending || !title.trim() || !content.trim() || (isSecret && !secretPassword.trim())}
                    >
                      {mut.isPending ? (
                        <>
                          <span className="ui-spinner-small"></span>
                          발행 중...
                        </>
                      ) : (
                        <>
                          {isSecret ? "비밀글 발행" : "발행하기"}
                          <span>🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              // 미리보기 모드
              <div className="new-post-preview-mode">
                <div className="new-post-preview-header">
                  <h3>📖 미리보기</h3>
                  <button
                    onClick={handlePreviewToggle}
                    className="ui-btn ui-btn-secondary ui-btn-sm"
                  >
                    <span>✏️</span>
                    편집으로 돌아가기
                  </button>
                </div>

                <div className="new-post-preview-container">
                  {isSecret && (
                    <div className="post-preview-secret-badge">
                      <span>🔐</span>
                      <span>비밀글</span>
                    </div>
                  )}

                  <div className="new-post-preview-title">
                    {title || "제목이 입력되지 않았습니다"}
                  </div>

                  <div className="new-post-preview-meta">
                    <div className="post-preview-author">
                      <div className="post-preview-author-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="post-preview-author-info">
                        <span className="post-preview-author-name">{user.username}</span>
                        <span className="post-preview-date">방금 전</span>
                      </div>
                    </div>
                  </div>

                  <div className="new-post-preview-content">
                    {content || "내용이 입력되지 않았습니다"}
                  </div>

                  <div className="new-post-preview-footer">
                    <div className="post-preview-stats">
                      <span className="post-stat-item">
                        <span>💬</span>
                        댓글 0개
                      </span>
                      <span className="post-stat-item">
                        <span>👁️</span>
                        조회 0회
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 커스텀 모달 컴포넌트 */}
      <ConfirmModalComponent />
    </div>
  );
}