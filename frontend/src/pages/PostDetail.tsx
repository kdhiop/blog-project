import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPost, deletePost, updatePost } from "../api/posts";
import { addComment, getComments, deleteComment, updateComment } from "../api/comments";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useConfirmModal } from "../components/ConfirmModal";

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
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // 게시글 수정 모드 진입
  const startEditPost = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setIsEditingPost(true);
    }
  };

  // 게시글 수정 취소
  const cancelEditPost = () => {
    setIsEditingPost(false);
    setEditTitle("");
    setEditContent("");
  };

  // 댓글 수정 모드 진입
  const startEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(content);
  };

  // 댓글 수정 취소
  const cancelEditComment = () => {
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
    mutationFn: () => updatePost(postId, { title: editTitle, content: editContent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      setIsEditingPost(false);
    },
    onError: (error) => {
      console.error("게시글 수정 실패:", error);
      alert("게시글 수정에 실패했습니다. 작성자만 수정할 수 있습니다.");
    },
  });

  // 게시글 삭제
  const deletePostMut = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    },
    onError: (error) => {
      console.error("게시글 삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다. 작성자만 삭제할 수 있습니다.");
    },
  });

  // 댓글 수정
  const updateCommentMut = useMutation({
    mutationFn: (commentId: number) =>
      updateComment(postId, commentId, { content: editCommentText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      cancelEditComment();
    },
    onError: (error) => {
      console.error("댓글 수정 실패:", error);
      alert("댓글 수정에 실패했습니다. 작성자만 수정할 수 있습니다.");
    },
  });

  // 댓글 삭제
  const deleteCommentMut = useMutation({
    mutationFn: (commentId: number) => deleteComment(postId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (error) => {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다. 작성자만 삭제할 수 있습니다.");
    },
  });

  const handleDeletePost = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!post?.author || post.author.id !== user.id) {
      alert("작성자만 삭제할 수 있습니다.");
      return;
    }
    
    const confirmed = await showConfirm({
      title: "게시글 삭제",
      message: "정말로 이 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
      type: "danger"
    });

    if (confirmed) {
      deletePostMut.mutate();
    }
  };

  const handleDeleteComment = (commentId: number, authorId?: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!authorId || authorId !== user.id) {
      alert("작성자만 삭제할 수 있습니다.");
      return;
    }
    if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      deleteCommentMut.mutate(commentId);
    }
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
          <Link to="/" className="ui-btn ui-btn-primary">홈으로 돌아가기</Link>
        </div>
      </div>
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
                <h1 className="post-detail-title">{post.title}</h1>
                <div className="post-detail-meta">
                  {post.author && (
                    <div className="post-detail-author">
                      <div className="post-detail-author-avatar">
                        {post.author.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="post-detail-author-info">
                        <span className="post-detail-author-label">작성자</span>
                        <span className="post-detail-author-name">{post.author.username}</span>
                      </div>
                    </div>
                  )}

                  {user && post.author && post.author.id === user.id && (
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
                          <>삭제 중...</>
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
                <div className="post-detail-content">{post.content}</div>
              </div>
            </>
          ) : (
            // 게시글 수정 모드
            <div className="post-edit-mode">
              <div className="post-edit-header">
                <h2>게시글 수정</h2>
                <div className="post-edit-actions">
                  <button onClick={cancelEditPost} className="ui-btn ui-btn-secondary">
                    취소
                  </button>
                  <button
                    onClick={() => updatePostMut.mutate()}
                    disabled={updatePostMut.isPending}
                    className="ui-btn ui-btn-primary"
                  >
                    {updatePostMut.isPending ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
              <div className="post-edit-form">
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="제목"
                />
                <textarea
                  className="form-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="내용"
                  rows={10}
                />
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
              <button className="post-share-btn" title="공유하기">
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
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  {editingCommentId === c.id ? (
                    // 댓글 수정 모드
                    <div className="comment-edit-mode">
                      <textarea
                        className="comment-edit-textarea"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        rows={3}
                      />
                      <div className="comment-edit-actions">
                        <button
                          onClick={cancelEditComment}
                          className="ui-btn ui-btn-secondary"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => updateCommentMut.mutate(c.id)}
                          disabled={updateCommentMut.isPending}
                          className="ui-btn ui-btn-primary"
                        >
                          {updateCommentMut.isPending ? "저장 중..." : "저장"}
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
                            </span>
                            <span className="comment-time">방금 전</span>
                          </div>
                        </div>

                        {user && c.author && c.author.id === user.id && (
                          <div className="comment-actions">
                            <button
                              onClick={() => startEditComment(c.id, c.content)}
                              className="comment-edit-btn"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id, c.author?.id)}
                              disabled={deleteCommentMut.isPending}
                              className="comment-delete-btn"
                            >
                              삭제
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
                  rows={3}
                  disabled={addCommentMut.isPending}
                />
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
                    <>작성 중...</>
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
      <ConfirmModalComponent />
    </div>
  );
}