import { useQuery } from "@tanstack/react-query";
import { getPosts, type Post } from "../api/posts";
import { Link } from "react-router-dom";

export default function Home() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["posts"], queryFn: getPosts });

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>불러오기 실패</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Posts</h1>
      <ul>
        {data!.map((p: Post) => (
          <li key={p.id} style={{ margin: "8px 0" }}>
            <Link to={`/posts/${p.id}`}>{p.title}</Link>
            {p.author && <small style={{ marginLeft: 8, opacity: 0.7 }}>by {p.author.username}</small>}
          </li>
        ))}
      </ul>
    </div>
  );
}
