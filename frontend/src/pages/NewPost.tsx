import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./NewPost.css";

export default function NewPost() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  const mut = useMutation({
    mutationFn: () => createPost(user!.id, { title, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      nav("/");
    },
  });

  const handleCancel = () => {
    if (title || content) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) {
        nav("/");
      }
    } else {
      nav("/");
    }
  };

  const charCount = content.length;
  const maxChars = 2000;

  return (
    <div className="new-post-container">
      <div className="new-post-wrapper">
        <div className="new-post-card">
          <div className="new-post-header">
            <div className="header-content">
              <div className="header-title">
                <div className="header-icon">✍️</div>
                <div className="header-text">
                  <h1>새 글 작성</h1>
                  <p>당신의 이야기를 공유해보세요</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCancel}
                className="cancel-btn"
              >
                취소
              </button>
            </div>
          </div>

          <div className="new-post-body">
            {!isPreview ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!user) return alert("로그인 후 작성하세요.");
                  mut.mutate();
                }}
                className="post-form"
              >
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    <span className="label-icon">📌</span>
                    제목
                    <span className="required">*</span>
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
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content" className="form-label">
                    <span className="label-icon">📝</span>
                    내용
                    <span className="required">*</span>
                  </label>
                  
                  <div className="toolbar">
                    <button type="button" className="toolbar-btn" title="굵게">
                      <strong>B</strong>
                    </button>
                    <button type="button" className="toolbar-btn" title="기울임">
                      <em>I</em>
                    </button>
                    <button type="button" className="toolbar-btn" title="밑줄">
                      <u>U</u>
                    </button>
                    <div className="toolbar-separator"></div>
                    <button type="button" className="toolbar-btn" title="목록">
                      📋
                    </button>
                    <button type="button" className="toolbar-btn" title="링크">
                      🔗
                    </button>
                    <button type="button" className="toolbar-btn" title="이미지">
                      🖼️
                    </button>
                  </div>
                  
                  <textarea
                    id="content"
                    className="form-input form-textarea with-toolbar"
                    placeholder="여기에 당신의 생각, 아이디어, 이야기를 자유롭게 작성해보세요.&#10;&#10;마크다운 문법을 지원합니다:&#10;- **굵은 글씨** 또는 *기울임*&#10;- [링크](url)&#10;- ![이미지](url)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    maxLength={maxChars}
                  />
                  <div className={`char-count ${charCount > maxChars * 0.9 ? 'warning' : ''} ${charCount >= maxChars ? 'error' : ''}`}>
                    {charCount} / {maxChars}
                  </div>
                </div>

                <div className="form-footer">
                  <div className="draft-info">
                    <span>💾</span>
                    <span>임시저장은 자동으로 진행됩니다</span>
                  </div>
                  
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setIsPreview(true)}
                      className="btn-secondary"
                      disabled={!title || !content}
                    >
                      미리보기
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={mut.isPending || !title || !content}
                    >
                      {mut.isPending ? (
                        <>
                          <span className="spinner-small"></span>
                          발행 중...
                        </>
                      ) : (
                        <>
                          발행하기
                          <span>🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {mut.isError && (
                  <div className="error-message">
                    <span>⚠️</span>
                    작성에 실패했습니다. 다시 시도해주세요.
                  </div>
                )}
              </form>
            ) : (
              <div className="preview-mode">
                <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>미리보기</h3>
                  <button
                    onClick={() => setIsPreview(false)}
                    className="btn-secondary"
                  >
                    편집으로 돌아가기
                  </button>
                </div>
                <div className="preview-title">{title}</div>
                <div className="preview-content">{content}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}