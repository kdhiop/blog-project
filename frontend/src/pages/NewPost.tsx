import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function NewPost() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const mut = useMutation({
    mutationFn: () => createPost(user!.id, { title, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      nav("/");
    },
  });

  return (
    <div style={{ padding: 16 }}>
      <h1>New Post</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!user) return alert("로그인 후 작성하세요.");
          mut.mutate();
        }}
        style={{ display: "grid", gap: 8, maxWidth: 600 }}
      >
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required />
        <button type="submit" disabled={mut.isPending}>Create</button>
        {mut.isError && <div style={{ color: "crimson" }}>작성 실패</div>}
      </form>
    </div>
  );
}
