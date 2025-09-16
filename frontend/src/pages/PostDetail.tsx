import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPost, deletePost, updatePost, verifySecretPassword } from "../api/posts";
import { addComment, getComments, deleteComment, updateComment } from "../api/comments";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useConfirmModal } from "../components/ConfirmModal";
import SecretPasswordModal from "../components/SecretPasswordModal";

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { showConfirm, ConfirmModalComponent } = useConfirmModal();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost(postId)
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId)
  });

  const [text, setText] = useState("");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIsSecret, setEditIsSecret] = useState(false);
  const [editSecretPassword, setEditSecretPassword] = useState("");
  const [showEditSecretPassword, setShowEditSecretPassword] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // 비밀글 관련 상태
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPasswordError, setSecretPasswordError] = useState("");

  // 작성자 여부 확인 함수
  const isAuthor = (post: any) => {
    return user && post?.author && post.author.id === user.id;
  };

  // 비밀글 모달을 표시해야 하는지 확인
  const shouldShowSecretModal = (post: any) => {
    if (!post?.isSecret) return false; // 공개글은 모달 불필요
    if (isAuthor(post)) return false; // 작성자는 모달 불필요
    return !post.hasAccess; // 비밀번호 확인 안된 경우만 모달 필요
  };

  // 비밀글 모달 표시 조건 확인 - 작성자가 아닌 경우에만
  useEffect(() => {
    if (post && shouldShowSecretModal(post) && !showSecretModal) {
      setShowSecretModal(true);
    }
  }, [post, user, showSecretModal]);

  // 비밀글 비밀번호 확인 뮤테이션
  const verifySecretMutation = useMutation({
    mutationFn: (password: string) => {
      setSecretPasswordError(""); // 에러 초기화
      return verifySecretPassword(postId, password);
    },
    onSuccess: (verifiedPost) => {
      qc.setQueryData(["post", postId], verifiedPost);
      setShowSecretModal(false);
      setSecretPasswordError("");
    },
    onError: (error: any) => {
      console.error("비밀글 비밀번호 확인 실패:", error);
      if (error.response?.status === 403 || error.message?.includes("비밀번호")) {
        setSecretPasswordError("비밀번호가 일치하지 않습니다.");
      } else {
        setSecretPasswordError("비밀번호 확인 중 오류가 발생했습니다.");
      }
    }
  });

  // 게시글 수정 모드 진입
  const startEditPost = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setEditIsSecret(Boolean(post.isSecret));
      setEditSecretPassword("");
      setIsEditingPost(true);
    }
  };

  // 게시글 수정 취소
  const cancelEditPost = async () => {
    const hasChanges = editTitle !== post?.title || 
                      editContent !== post?.content || 
                      editIsSecret !== Boolean(post?.isSecret) ||
                      editSecretPassword.trim() !== "";

    if (hasChanges) {
      const confirmed = await showConfirm({
        title: "수정 취소",
        message: "수정된 내용이 있습니다.\n정말로 취소하시겠습니까?",
        confirmText: "취소하기",
        cancelText: "계속 수정",
        type: "warning"
      });
      
      if (!confirmed) return;
    }
    
    setIsEditingPost(false);
    setEditTitle("");
    setEditContent("");
    setEditIsSecret(false);
    setEditSecretPassword("");
  };

  // 비밀글 설정 토글 (수정 시)
  const handleEditSecretToggle = async (checked: boolean) => {
    if (checked && !editIsSecret) {
      const confirmed = await showConfirm({
        title: "비밀글 설정",
        message: "이 게시글을 비밀글로 변경하시겠습니까?\n\n비밀글은 작성자와 비밀번호를 아는 사용자만 볼 수 있습니다.",
        confirmText: "비밀글로 변경",
        cancelText: "취소",
        type: "info"
      });
      
      if (confirmed) {
        setEditIsSecret(true);
      }
    } else if (!checked && editIsSecret) {
      const confirmed = await showConfirm({
        title: "비밀글 해제",
        message: "비밀글 설정을 해제하시겠습니까?\n\n게시글이 모든 사용자에게 공개됩니다.",
        confirmText: "공개글로 변경",
        cancelText: "취소",
        type: "warning"
      });
      
      if (confirmed) {
        setEditIsSecret(false);
        setEditSecretPassword("");
      }
    }
  };

  // 댓글 수정 모드 진입
  const startEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(content);
  };

  // 댓글 수정 취소
  const cancelEditComment = async () => {
    const originalContent = comments?.find(c => c.id === editingCommentId)?.content;
    if (editCommentText !== originalContent) {
      const confirmed = await showConfirm({
        title: "댓글 수정 취소",
        message: "수정된 내용이 있습니다.\n정말로 취소하시겠습니까?",
        confirmText: "취소하기",
        cancelText: "계속 수정",
        type: "warning"
      });
      
      if (!confirmed) return;
    }
    
    setEditingCommentId(null);
    setEditCommentText("");
  };

  // 댓글 추가
  const addCommentMut = useMutation({
    mutationFn: () => addComment(postId, { content: text }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (error) => {
      console.error("댓글 작성 실패:", error);
    }
  });

  // 게시글 수정
  const updatePostMut = useMutation({
    mutationFn: () => updatePost(postId, { 
      title: editTitle, 
      content: editContent,
      isSecret: editIsSecret,
      secretPassword: editIsSecret && editSecretPassword.trim() ? editSecretPassword : undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      setIsEditingPost(false);
      setEditTitle("");
      setEditContent("");
      setEditIsSecret(false);
      setEditSecretPassword("");
    },
    onError: async (error) => {
      console.error("게시글 수정 실패:", error);
      await showConfirm({
        title: "수정 실패",
        message: "게시글 수정에 실패했습니다.\n작성자만 수정할 수 있습니다.",
        confirmText: "확인",
        type: "danger",
        showCancel: false
      });
    },
  });

  // 게시글 삭제
  const deletePostMut = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    },
    onError: async (error) => {
      console.error("게시글 삭제 실패:", error);
      await showConfirm({
        title: "삭제 실패",
        message: "게시글 삭제에 실패했습니다.\n작성자만 삭제할 수 있습니다.",
        confirmText: "확인",
        type: "danger",
        showCancel: false
      });
    },
  });

  // 댓글 수정
  const updateCommentMut = useMutation({
    mutationFn: (commentId: number) =>
      updateComment(postId, commentId, { content: editCommentText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      setEditingCommentId(null);
      setEditCommentText("");
    },
    onError: async (error) => {
      console.error("댓글 수정 실패:", error);
      await showConfirm({
        title: "수정 실패",
        message: "댓글 수정에 실패했습니다.\n작성자만 수정할 수 있습니다.",
        confirmText: "확인",
        type: "danger",
        showCancel: false
      });
    },
  });

  // 댓글 삭제
  const deleteCommentMut = useMutation({
    mutationFn: (commentId: number) => deleteComment(postId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: async (error) => {
      console.error("댓글 삭제 실패:", error);
      await showConfirm({
        title: "삭제 실패",
        message: "댓글 삭제에 실패했습니다.\n작성자만 삭제할 수 있습니다.",
        confirmText: "확인",
        type: "danger",
        showCancel: false
      });
    },
  });

  // 게시글 삭제 핸들러
  const handleDeletePost = async () => {
    if (!user) {
      await showConfirm({
        title: "로그인 필요",
        message: "로그인이 필요한 기능입니다.",
        confirmText: "확인",
        type: "info",
        showCancel: false
      });
      return;
    }

    if (!post || !isAuthor(post)) {
      await showConfirm({
        title: "권한 없음",
        message: "작성자만 삭제할 수 있습니다.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }
    
    const postType = post.isSecret ? "비밀글" : "게시글";
    const confirmed = await showConfirm({
      title: `${postType} 삭제`,
      message: `정말로 "${post.title}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 댓글도 함께 삭제됩니다.`,
      confirmText: "삭제하기",
      cancelText: "취소",
      type: "danger"
    });

    if (confirmed) {
      deletePostMut.mutate();
    }
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: number, authorId?: number, content?: string) => {
    if (!user) {
      await showConfirm({
        title: "로그인 필요",
        message: "로그인이 필요한 기능입니다.",
        confirmText: "확인",
        type: "info",
        showCancel: false
      });
      return;
    }

    if (!authorId || authorId !== user.id) {
      await showConfirm({
        title: "권한 없음",
        message: "작성자만 삭제할 수 있습니다.",
        confirmText: "확인",
        type: "warning",
        showCancel: false
      });
      return;
    }
    
    const previewContent = content && content.length > 50 
      ? `${content.substring(0, 50)}...` 
      : content;

    const confirmed = await showConfirm({
      title: "댓글 삭제",
      message: `정말로 이 댓글을 삭제하시겠습니까?\n\n"${previewContent}"\n\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: "삭제하기",
      cancelText: "취소",
      type: "danger"
    });

    if (confirmed) {
      deleteCommentMut.mutate(commentId);
    }
  };

  // 비밀글 비밀번호 입력 모달 핸들러
  const handleSecretPasswordSubmit = (password: string) => {
    verifySecretMutation.mutate(password);
  };

  const handleSecretPasswordCancel = () => {
    setShowSecretModal(false);
    setSecretPasswordError("");
    navigate("/"); // 비밀글 접근 취소 시 홈으로 이동
  };

  if (postLoading) {
    return (
      <div className="post-detail-container">
        <div className="ui-loading-container">
          <div className="ui-spinner"></div>
          <p className="ui-loading-text">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="ui-error-container">
          <span className="ui-error-icon">😕</span>
          <h2>게시글을 찾을 수 없습니다</h2>
          <p>요청하신 게시글이 존재하지 않거나 삭제되었을 수 있습니다.</p>
          <Link to="/" className="ui-btn ui-btn-primary">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  // 비밀글이고 접근 권한이 없는 경우에만 모달 표시
  // 단, 작성자인 경우는 제외
  if (post && shouldShowSecretModal(post)) {
    return (
      <>
        <div className="post-detail-container">
          <div className="ui-loading-container">
            <div className="post-detail-secret-waiting">
              <span className="post-detail-secret-icon">🔐</span>
              <h2>비밀글 접근</h2>
              <p>비밀번호를 입력하여 게시글을 확인하세요</p>
            </div>
          </div>
        </div>
        
        <SecretPasswordModal
          isOpen={showSecretModal}
          title={post?.title || ""}
          onConfirm={handleSecretPasswordSubmit}
          onCancel={handleSecretPasswordCancel}
          isLoading={verifySecretMutation.isPending}
          error={secretPasswordError}
        />
      </>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-wrapper">
        {/* 게시글 본문 */}
        <article className="post-article">
          {!isEditingPost ? (
            <>
              <div className="post-detail-header">
                <div className="post-title-container">
                  {post.isSecret && (
                    <div className="post-secret-badge">
                      <span>🔐</span>
                      <span>비밀글</span>
                      {isAuthor(post) && (
                        <span className="post-secret-owner-indicator">
                          (내 비밀글)
                        </span>
                      )}
                    </div>
                  )}
                  <h1 className="post-detail-title">{post.title}</h1>
                </div>
                
                <div className="post-detail-meta">
                  {post.author && (
                    <div className="post-detail-author">
                      <div className="post-detail-author-avatar">
                        {post.author.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="post-detail-author-info">
                        <span className="post-detail-author-label">작성자</span>
                        <span className="post-detail-author-name">
                          {post.author.username}
                          {isAuthor(post) && (
                            <span className="post-detail-author-badge">(나)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {isAuthor(post) && (
                    <div className="post-detail-actions">
                      <button onClick={startEditPost} className="post-edit-btn">
                        <span>✏️</span>
                        수정
                      </button>
                      <button
                        onClick={handleDeletePost}
                        disabled={deletePostMut.isPending}
                        className="post-delete-btn ui-btn-danger"
                      >
                        {deletePostMut.isPending ? (
                          <>
                            <span className="ui-spinner-small"></span>
                            삭제 중...
                          </>
                        ) : (
                          <>
                            <span>🗑️</span>
                            삭제
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="post-detail-body">
                <div className="post-detail-content">
                  {/* 작성자는 항상 실제 내용을 볼 수 있음 */}
                  {post.isSecret && !isAuthor(post) && !post.hasAccess 
                    ? "[비밀글입니다. 비밀번호를 입력해주세요.]" 
                    : post.content
                  }
                </div>
              </div>
            </>
          ) : (
            // 게시글 수정 모드
            <div className="post-edit-mode">
              <div className="post-edit-header">
                <h2>{editIsSecret ? "비밀글 수정" : "게시글 수정"}</h2>
                <div className="post-edit-actions">
                  <button onClick={cancelEditPost} className="ui-btn ui-btn-secondary">
                    취소
                  </button>
                  <button
                    onClick={() => updatePostMut.mutate()}
                    disabled={updatePostMut.isPending || !editTitle.trim() || !editContent.trim() || (editIsSecret && !editSecretPassword.trim() && !post?.isSecret)}
                    className="ui-btn ui-btn-primary"
                  >
                    {updatePostMut.isPending ? (
                      <>
                        <span className="ui-spinner-small"></span>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        저장
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="post-edit-form">
                <div className="form-group">
                  <label htmlFor="edit-title" className="form-label">
                    <span className="form-label-icon">📝</span>
                    제목
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    className="form-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    maxLength={100}
                  />
                </div>

                {/* 비밀글 설정 */}
                <div className="form-group">
                  <div className="secret-post-toggle">
                    <label className="secret-toggle-label">
                      <input
                        type="checkbox"
                        checked={editIsSecret}
                        onChange={(e) => handleEditSecretToggle(e.target.checked)}
                        disabled={updatePostMut.isPending}
                        className="secret-toggle-input"
                      />
                      <div className="secret-toggle-switch">
                        <div className="secret-toggle-slider"></div>
                      </div>
                      <span className="secret-toggle-text">
                        <span className="secret-toggle-icon">{editIsSecret ? "🔐" : "🔓"}</span>
                        <span>비밀글로 설정</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* 비밀글 비밀번호 */}
                {editIsSecret && (
                  <div className="form-group">
                    <label htmlFor="edit-secret-password" className="form-label">
                      <span className="form-label-icon">🔑</span>
                      비밀글 비밀번호
                      {!post?.isSecret && <span className="form-required">*</span>}
                    </label>
                    <div className="secret-password-input-container">
                      <input
                        id="edit-secret-password"
                        type={showEditSecretPassword ? "text" : "password"}
                        className="form-input"
                        placeholder={post?.isSecret ? "새 비밀번호 (공백 시 기존 비밀번호 유지)" : "비밀글을 보기 위한 비밀번호를 입력하세요"}
                        value={editSecretPassword}
                        onChange={(e) => setEditSecretPassword(e.target.value)}
                        maxLength={50}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditSecretPassword(!showEditSecretPassword)}
                        className="secret-password-toggle-btn"
                        title={showEditSecretPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                      >
                        {showEditSecretPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    {post?.isSecret && (
                      <div className="form-hint">
                        기존 비밀글의 비밀번호를 변경하려면 새 비밀번호를 입력하세요.
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-content" className="form-label">
                    <span className="form-label-icon">📄</span>
                    내용
                  </label>
                  <textarea
                    id="edit-content"
                    className="form-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="내용을 입력하세요"
                    rows={15}
                    maxLength={2000}
                  />
                  <div className={`form-char-count ${editContent.length > 1800 ? 'form-char-count--warning' : ''} ${editContent.length >= 2000 ? 'form-char-count--error' : ''}`}>
                    {editContent.length} / 2000
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="ui-card-footer">
            <div className="post-detail-stats">
              <span className="post-stat-item">
                <span>💬</span>
                댓글 {comments?.length || 0}개
              </span>
              <span className="post-stat-item">
                <span>👁️</span>
                조회 128회
              </span>
            </div>
            <div className="post-share-buttons">
              <button 
                className="post-share-btn" 
                title="링크 복사"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                  } catch (err) {
                    console.error('링크 복사 실패:', err);
                  }
                }}
              >
                <span>🔗</span>
              </button>
              <button className="post-share-btn" title="북마크">
                <span>📌</span>
              </button>
            </div>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <section className="comments-section">
          <div className="comments-header">
            <h2 className="comments-title">
              <span>💬</span>
              댓글
              {comments && comments.length > 0 && (
                <span className="comments-count">{comments.length}</span>
              )}
            </h2>
          </div>

          {/* 댓글 목록 */}
          {commentsLoading ? (
            <div className="ui-loading-container">
              <div className="ui-spinner"></div>
              <p className="ui-loading-text">댓글을 불러오는 중...</p>
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  {editingCommentId === c.id ? (
                    // 댓글 수정 모드
                    <div className="comment-edit-mode">
                      <div className="form-group">
                        <textarea
                          className="comment-edit-textarea"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          placeholder="댓글을 입력하세요..."
                          rows={4}
                          maxLength={500}
                        />
                        <div className={`form-char-count ${editCommentText.length > 450 ? 'form-char-count--warning' : ''} ${editCommentText.length >= 500 ? 'form-char-count--error' : ''}`}>
                          {editCommentText.length} / 500
                        </div>
                      </div>
                      <div className="comment-edit-actions">
                        <button
                          onClick={cancelEditComment}
                          className="ui-btn ui-btn-secondary ui-btn-sm"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => updateCommentMut.mutate(c.id)}
                          disabled={updateCommentMut.isPending || !editCommentText.trim()}
                          className="ui-btn ui-btn-primary ui-btn-sm"
                        >
                          {updateCommentMut.isPending ? (
                            <>
                              <span className="ui-spinner-small"></span>
                              저장 중...
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              저장
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="comment-header">
                        <div className="comment-author">
                          <div className="comment-avatar">
                            {c.author ? c.author.username.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div className="comment-author-info">
                            <span className="comment-author-name">
                              {c.author ? c.author.username : "익명"}
                              {user && c.author && c.author.id === user.id && (
                                <span className="comment-author-badge">(나)</span>
                              )}
                            </span>
                            <span className="comment-time">방금 전</span>
                          </div>
                        </div>

                        {user && c.author && c.author.id === user.id && (
                          <div className="comment-actions">
                            <button
                              onClick={() => startEditComment(c.id, c.content)}
                              className="comment-edit-btn"
                              title="댓글 수정"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id, c.author?.id, c.content)}
                              disabled={deleteCommentMut.isPending}
                              className="comment-delete-btn"
                              title="댓글 삭제"
                            >
                              {deleteCommentMut.isPending ? "삭제 중..." : "삭제"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="comment-content">
                        {c.content}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="comments-empty">
              <div className="home-empty-icon">💭</div>
              <p className="comments-empty-text">아직 댓글이 없습니다</p>
              <p className="comments-empty-subtext">첫 번째 댓글을 작성해보세요!</p>
            </div>
          )}

          {/* 댓글 작성 폼 */}
          {user ? (
            <div className="comment-form">
              <div className="comment-form-header">
                <h3 className="comment-form-title">댓글 작성</h3>
                <p className="comment-form-subtitle">여러분의 생각을 공유해주세요</p>
              </div>

              <div className="comment-input-wrapper">
                <textarea
                  className="comment-textarea"
                  placeholder="댓글을 입력하세요... (Ctrl+Enter로 전송)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter' && text.trim()) {
                      addCommentMut.mutate();
                    }
                  }}
                  rows={4}
                  disabled={addCommentMut.isPending}
                  maxLength={500}
                />
                <div className={`form-char-count ${text.length > 450 ? 'form-char-count--warning' : ''} ${text.length >= 500 ? 'form-char-count--error' : ''}`}>
                  {text.length} / 500
                </div>
              </div>

              <div className="comment-form-footer">
                <span className="comment-guidelines">
                  건전한 토론 문화를 위해 서로를 존중해주세요 💙
                </span>
                <button
                  onClick={() => {
                    if (!text.trim()) return;
                    addCommentMut.mutate();
                  }}
                  disabled={!text.trim() || addCommentMut.isPending}
                  className="comment-submit-btn"
                >
                  {addCommentMut.isPending ? (
                    <>
                      <span className="ui-spinner-small"></span>
                      작성 중...
                    </>
                  ) : (
                    <>
                      댓글 달기
                      <span>✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-login-prompt">
              <div className="comment-login-prompt-icon">🔒</div>
              <p className="comment-login-prompt-text">댓글을 작성하려면 로그인이 필요합니다</p>
              <Link to="/login" className="comment-login-prompt-btn">
                로그인하기
                <span>→</span>
              </Link>
            </div>
          )}
        </section>
      </div>
      
      {/* 비밀글 비밀번호 입력 모달 */}
      <SecretPasswordModal
        isOpen={showSecretModal}
        title={post?.title || ""}
        onConfirm={handleSecretPasswordSubmit}
        onCancel={handleSecretPasswordCancel}
        isLoading={verifySecretMutation.isPending}
        error={secretPasswordError}
      />
      
      {/* 커스텀 모달 컴포넌트 */}
      <ConfirmModalComponent />
    </div>
  );
}