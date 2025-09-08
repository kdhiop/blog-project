import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPost, deletePost } from "../api/posts";
import { addComment, getComments, deleteComment } from "../api/comments";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: post } = useQuery({ queryKey: ["post", postId], queryFn: () => getPost(postId) });
  const { data: comments } = useQuery({ queryKey: ["comments", postId], queryFn: () => getComments(postId) });

  const [text, setText] = useState("");

  // 댓글 추가
  const addCommentMut = useMutation({
    mutationFn: () => addComment(postId, user!.id, { content: text }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  // 게시글 삭제
  const deletePostMut = useMutation({
    mutationFn: () => deletePost(postId, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      navigate("/"); // 게시글 삭제 후 홈으로 이동
    },
    onError: (error) => {
      console.error("게시글 삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다. 작성자만 삭제할 수 있습니다.");
    },
  });

  // 댓글 삭제
  const deleteCommentMut = useMutation({
    mutationFn: (commentId: number) => deleteComment(postId, commentId, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (error) => {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다. 작성자만 삭제할 수 있습니다.");
    },
  });

  const handleDeletePost = () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!post?.author || post.author.id !== user.id) {
      alert("작성자만 삭제할 수 있습니다.");
      return;
    }
    if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
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

  if (!post) return <div style={{ padding: 16 }}>불러오는 중...</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1>{post.title}</h1>
          {post.author && <p style={{ opacity: 0.7, margin: 0 }}>by {post.author.username}</p>}
        </div>
        {user && post.author && post.author.id === user.id && (
          <button
            onClick={handleDeletePost}
            disabled={deletePostMut.isPending}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            {deletePostMut.isPending ? "삭제 중..." : "게시글 삭제"}
          </button>
        )}
      </div>

      <p style={{ whiteSpace: "pre-wrap", marginBottom: 32 }}>{post.content}</p>

      <h2 style={{ marginTop: 24 }}>Comments</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {comments?.map((c) => (
          <li
            key={c.id}
            style={{
              margin: "12px 0",
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 4,
              backgroundColor: "#f9f9f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, marginBottom: 8 }}>{c.content}</p>
                {c.author && <small style={{ opacity: 0.7 }}>— {c.author.username}</small>}
              </div>
              {user && c.author && c.author.id === user.id && (
                <button
                  onClick={() => handleDeleteComment(c.id, c.author?.id)}
                  disabled={deleteCommentMut.isPending}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "0.8em",
                    marginLeft: 8,
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <textarea
          placeholder={user ? "댓글을 입력하세요…" : "로그인 후 댓글 작성 가능"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!user}
          rows={3}
          style={{ width: "100%", maxWidth: 600 }}
        />
        <div>
          <button
            onClick={() => {
              if (!user) return alert("로그인이 필요합니다.");
              if (!text.trim()) return;
              addCommentMut.mutate();
            }}
            disabled={!user || addCommentMut.isPending}
            style={{ marginTop: 6 }}
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
}