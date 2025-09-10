// src/pages/Home.tsx
import { useQuery } from "@tanstack/react-query";
import { getPosts, type Post } from "../api/posts";
import { Link } from "react-router-dom";

export default function Home() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["posts"], queryFn: getPosts });

  if (isLoading) {
    return (
      <div className="ui-loading-container">
        <div className="ui-spinner"></div>
        <p className="ui-loading-text">게시글을 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ui-error-container">
        <span className="ui-error-icon">⚠️</span>
        <h2>오류가 발생했습니다</h2>
        <p>게시글을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          <span className="home-title-gradient">블로그 게시글</span>
        </h1>
        <p className="home-subtitle">생각과 아이디어를 공유하는 공간</p>
      </div>

      {data && data.length === 0 ? (
        <div className="home-empty-state">
          <span className="home-empty-icon">📭</span>
          <h3>아직 게시글이 없습니다</h3>
          <p>첫 번째 게시글을 작성해보세요!</p>
          <Link to="/new" className="home-cta-button">
            첫 게시글 작성하기
          </Link>
        </div>
      ) : (
        <div className="home-posts-grid">
          {data!.map((post: Post) => (
            <article key={post.id} className="post-card">
              <Link to={`/posts/${post.id}`} className="post-card-link">
                <div className="post-card-header">
                  <h2 className="post-card-title">{post.title}</h2>
                  {post.author && (
                    <div className="post-card-meta">
                      <span className="post-card-author-avatar">✍️</span>
                      <span className="post-card-author-name">{post.author.username}</span>
                    </div>
                  )}
                </div>
                <p className="post-card-excerpt">
                  {post.content.length > 150
                    ? `${post.content.substring(0, 150)}...`
                    : post.content}
                </p>
                <div className="post-card-footer">
                  <span className="post-card-read-more">
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