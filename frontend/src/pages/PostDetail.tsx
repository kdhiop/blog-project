import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPost } from "../api/posts";
import { addComment, getComments } from "../api/comments";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: post } = useQuery({ queryKey: ["post", postId], queryFn: () => getPost(postId) });
  const { data: comments } = useQuery({ queryKey: ["comments", postId], queryFn: () => getComments(postId) });

  const [text, setText] = useState("");
  const mut = useMutation({
    mutationFn: () => addComment(postId, user!.id, { content: text }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  if (!post) return <div style={{ padding: 16 }}>불러오는 중...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>{post.title}</h1>
      <p style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
      {post.author && <p style={{ opacity: 0.7 }}>by {post.author.username}</p>}

      <h2 style={{ marginTop: 24 }}>Comments</h2>
      <ul>
        {comments?.map((c) => (
          <li key={c.id} style={{ margin: "6px 0" }}>
            {c.content} {c.author && <small style={{ marginLeft: 8, opacity: 0.7 }}>— {c.author.username}</small>}
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
              mut.mutate();
            }}
            disabled={!user || mut.isPending}
            style={{ marginTop: 6 }}
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
}
