import { useQuery } from "@tanstack/react-query";
import { getPosts, type Post } from "../api/posts";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["posts"], queryFn: getPosts });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>게시글을 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="error-container">
        <span className="error-icon">⚠️</span>
        <h2>오류가 발생했습니다</h2>
        <p>게시글을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          <span className="title-gradient">블로그 게시글</span>
        </h1>
        <p className="home-subtitle">생각과 아이디어를 공유하는 공간</p>
      </div>

      {data && data.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>아직 게시글이 없습니다</h3>
          <p>첫 번째 게시글을 작성해보세요!</p>
          <Link to="/new" className="cta-button">
            첫 게시글 작성하기
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {data!.map((post: Post) => (
            <article key={post.id} className="post-card">
              <Link to={`/posts/${post.id}`} className="post-link">
                <div className="post-header">
                  <h2 className="post-title">{post.title}</h2>
                  {post.author && (
                    <div className="post-meta">
                      <span className="author-avatar">✍️</span>
                      <span className="author-name">{post.author.username}</span>
                    </div>
                  )}
                </div>
                <p className="post-excerpt">
                  {post.content.length > 150 
                    ? `${post.content.substring(0, 150)}...` 
                    : post.content}
                </p>
                <div className="post-footer">
                  <span className="read-more">
                    읽기 →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}