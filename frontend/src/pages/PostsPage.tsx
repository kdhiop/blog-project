import { useQuery } from "@tanstack/react-query";
import { getPosts, searchPosts, type Post } from "../api/posts";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";

export default function PostsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // URL에서 검색어 초기화
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
      setIsSearching(true);
    } else {
      setSearchQuery("");
      setIsSearching(false);
    }
  }, [location.search]);

  // 게시글 목록 쿼리 (검색 없을 때)
  const { 
    data: allPosts, 
    isLoading: isLoadingPosts, 
    isError: isErrorPosts,
    error: postsError
  } = useQuery({ 
    queryKey: ["posts"], 
    queryFn: () => getPosts(),
    enabled: !isSearching
  });

  // 검색 쿼리
  const { 
    data: searchResults, 
    isLoading: isSearchLoading, 
    isError: isSearchError,
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => searchPosts(searchQuery),
    enabled: isSearching && searchQuery.trim().length >= 2,
    retry: 1,
    staleTime: 30 * 1000,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query.trim());
    
    if (query.trim()) {
      refetchSearch();
    }
  };

  // 게시글 제목과 내용 표시 로직
  const getDisplayTitle = (post: Post) => {
    if (post.isSecret) {
      // 작성자 본인인 경우에만 제목 표시
      if (user && post.author?.id === user.id) {
        return post.title;
      }
      // 다른 사용자에게는 비밀글임을 표시
      return "🔐 비밀글";
    }
    return post.title;
  };

  const getDisplayContent = (post: Post) => {
    if (post.isSecret && (!user || post.author?.id !== user.id)) {
      return "비밀글입니다. 클릭하여 비밀번호를 입력해주세요.";
    }
    return post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content;
  };

  // 데이터와 로딩/에러 상태 결정
  const data = isSearching ? searchResults : allPosts;
  const isLoading = isSearching ? isSearchLoading : isLoadingPosts;
  const isError = isSearching ? isSearchError : isErrorPosts;
  const error = isSearching ? searchError : postsError;

  if (isLoading) {
    return (
      <div className="posts-page-container">
        <div className="posts-page-header">
          <div className="posts-page-title-section">
            <h1 className="posts-page-title">
              <span className="posts-page-title-icon">📚</span>
              <span className="posts-page-title-gradient">모든 게시글</span>
            </h1>
            <p className="posts-page-subtitle">
              커뮤니티의 모든 이야기를 한 곳에서 확인하세요
            </p>
          </div>

          <div className="posts-page-actions">
            <Link to="/new" className="posts-page-write-btn">
              <span>✏️</span>
              새 글 작성
            </Link>
          </div>
        </div>

        <SearchBar 
          onSearch={handleSearch} 
          className="posts-page-search-bar"
          showSuggestions={true}
          placeholder="게시글 검색..."
        />

        <div className="ui-loading-container">
          <div className="ui-spinner"></div>
          <p className="ui-loading-text">
            {isSearching ? `'${searchQuery}' 검색 중...` : "게시글을 불러오는 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다";
    
    return (
      <div className="posts-page-container">
        <div className="posts-page-header">
          <div className="posts-page-title-section">
            <h1 className="posts-page-title">
              <span className="posts-page-title-icon">📚</span>
              <span className="posts-page-title-gradient">모든 게시글</span>
            </h1>
            <p className="posts-page-subtitle">
              커뮤니티의 모든 이야기를 한 곳에서 확인하세요
            </p>
          </div>

          <div className="posts-page-actions">
            <Link to="/new" className="posts-page-write-btn">
              <span>✏️</span>
              새 글 작성
            </Link>
          </div>
        </div>

        <SearchBar 
          onSearch={handleSearch} 
          className="posts-page-search-bar"
          showSuggestions={true}
          placeholder="게시글 검색..."
        />

        <div className="ui-error-container">
          <span className="ui-error-icon">⚠️</span>
          <h2>
            {isSearching ? "검색 중 오류가 발생했습니다" : "오류가 발생했습니다"}
          </h2>
          <p>{errorMessage}</p>
          {isSearching && (
            <button 
              onClick={() => handleSearch(searchQuery)}
              className="ui-btn ui-btn-primary"
            >
              다시 검색하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="posts-page-container">
      <div className="posts-page-header">
        <div className="posts-page-title-section">
          <h1 className="posts-page-title">
            <span className="posts-page-title-icon">📚</span>
            <span className="posts-page-title-gradient">모든 게시글</span>
          </h1>
          <p className="posts-page-subtitle">
            {isSearching 
              ? `'${searchQuery}'에 대한 검색 결과` 
              : "커뮤니티의 모든 이야기를 한 곳에서 확인하세요"
            }
          </p>
        </div>

        <div className="posts-page-actions">
          <Link to="/new" className="posts-page-write-btn">
            <span>✏️</span>
            새 글 작성
          </Link>
        </div>
      </div>

      <SearchBar 
        onSearch={handleSearch} 
        className="posts-page-search-bar"
        showSuggestions={true}
        placeholder="게시글 검색..."
      />

      {/* 게시글 통계 */}
      {data && (
        <div className="posts-page-stats">
          <div className="posts-stat-item">
            <span className="posts-stat-icon">📄</span>
            <span className="posts-stat-label">총 게시글</span>
            <span className="posts-stat-value">{data.length}개</span>
          </div>
          {isSearching && (
            <div className="posts-stat-item">
              <span className="posts-stat-icon">🔍</span>
              <span className="posts-stat-label">검색 결과</span>
              <span className="posts-stat-value">{data.length}개</span>
            </div>
          )}
        </div>
      )}

      {data && data.length === 0 ? (
        <div className="posts-page-empty-state">
          <span className="posts-page-empty-icon">
            {isSearching ? "🔍" : "📭"}
          </span>
          <h3>
            {isSearching 
              ? `'${searchQuery}'에 대한 검색 결과가 없습니다` 
              : "아직 게시글이 없습니다"
            }
          </h3>
          <p>
            {isSearching 
              ? "다른 검색어로 시도해보거나 새로운 게시글을 작성해보세요" 
              : "첫 번째 게시글을 작성하여 커뮤니티를 시작해보세요!"
            }
          </p>
          <div className="posts-page-empty-actions">
            {isSearching && (
              <button 
                onClick={() => handleSearch("")}
                className="ui-btn ui-btn-secondary"
              >
                전체 게시글 보기
              </button>
            )}
            <Link to="/new" className="ui-btn ui-btn-primary">
              <span>✏️</span>
              {isSearching ? "새 게시글 작성" : "첫 게시글 작성하기"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="posts-page-grid">
          {data!.map((post: Post) => (
            <article key={post.id} className={`posts-page-card ${post.isSecret ? 'posts-page-card--secret' : ''}`}>
              <Link to={`/posts/${post.id}`} className="posts-page-card-link">
                <div className="posts-page-card-header">
                  <div className="posts-page-card-title-wrapper">
                    {post.isSecret && (
                      <div className="posts-page-card-secret-badge">
                        <span className="posts-page-card-secret-icon">🔐</span>
                        <span className="posts-page-card-secret-text">비밀글</span>
                      </div>
                    )}
                    <h2 className="posts-page-card-title">
                      {isSearching ? (
                        <HighlightedText 
                          text={getDisplayTitle(post)} 
                          highlight={post.isSecret && (!user || post.author?.id !== user.id) ? "" : searchQuery} 
                        />
                      ) : (
                        getDisplayTitle(post)
                      )}
                    </h2>
                  </div>
                  {post.author && (
                    <div className="posts-page-card-meta">
                      <div className="posts-page-card-author">
                        <span className="posts-page-card-author-avatar">
                          {post.author.username.charAt(0).toUpperCase()}
                        </span>
                        <span className="posts-page-card-author-name">
                          {isSearching ? (
                            <HighlightedText text={post.author.username} highlight={searchQuery} />
                          ) : (
                            post.author.username
                          )}
                        </span>
                      </div>
                      {post.isSecret && post.author.id === user?.id && (
                        <span className="posts-page-card-owner-badge" title="내가 작성한 비밀글">
                          👤
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="posts-page-card-excerpt">
                  {post.isSecret && (!user || post.author?.id !== user.id) ? (
                    <span className="posts-page-card-secret-preview">
                      🔒 비밀글입니다. 클릭하여 비밀번호를 입력해주세요.
                    </span>
                  ) : (
                    isSearching ? (
                      <HighlightedText 
                        text={getDisplayContent(post)}
                        highlight={searchQuery}
                      />
                    ) : (
                      getDisplayContent(post)
                    )
                  )}
                </p>
                <div className="posts-page-card-footer">
                  <div className="posts-page-card-stats">
                    <span className="posts-page-card-stat">
                      <span className="posts-page-card-stat-icon">💬</span>
                      <span className="posts-page-card-stat-text">댓글</span>
                    </span>
                    <span className="posts-page-card-stat">
                      <span className="posts-page-card-stat-icon">👁️</span>
                      <span className="posts-page-card-stat-text">조회</span>
                    </span>
                    <span className="posts-page-card-stat">
                      <span className="posts-page-card-stat-icon">⏰</span>
                      <span className="posts-page-card-stat-text">방금 전</span>
                    </span>
                  </div>
                  <span className="posts-page-card-read-more">
                    {post.isSecret && (!user || post.author?.id !== user.id) ? (
                      <>
                        <span className="posts-page-card-secret-icon">🔐</span>
                        열기
                      </>
                    ) : (
                      <>
                        자세히 보기 →
                      </>
                    )}
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* 검색 팁 */}
      {isSearching && data && data.length > 0 && (
        <div className="posts-page-search-tips">
          <h4>💡 검색 팁</h4>
          <ul>
            <li>여러 단어로 검색하면 더 정확한 결과를 얻을 수 있습니다</li>
            <li>제목, 내용, 작성자명에서 모두 검색됩니다</li>
            <li>대소문자는 구분하지 않습니다</li>
            <li>비밀글은 작성자만 제목과 내용을 볼 수 있습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// 검색어 하이라이트 컴포넌트
interface HighlightedTextProps {
  text: string;
  highlight: string;
}

function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <>{text}</>;
  }

  // 여러 키워드 지원
  const keywords = highlight.trim().toLowerCase().split(/\s+/);
  let highlightedText = text;

  keywords.forEach((keyword) => {
    if (keyword) {
      // 정규식 특수문자 이스케이프 처리 수정
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedKeyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }
  });

  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}