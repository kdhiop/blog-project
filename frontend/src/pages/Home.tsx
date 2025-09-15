import { useQuery } from "@tanstack/react-query";
import { getPosts, searchPosts, type Post } from "../api/posts";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";

export default function Home() {
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
    enabled: !isSearching // 검색 중이 아닐 때만 실행
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
    enabled: isSearching && searchQuery.trim().length >= 2, // 검색 중이고 검색어가 2자 이상일 때만 실행
    retry: 1,
    staleTime: 30 * 1000, // 30초 동안 캐시 유지
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query.trim());
    
    if (query.trim()) {
      // 검색어가 있으면 검색 실행
      refetchSearch();
    }
  };

  // 데이터와 로딩/에러 상태 결정
  const data = isSearching ? searchResults : allPosts;
  const isLoading = isSearching ? isSearchLoading : isLoadingPosts;
  const isError = isSearching ? isSearchError : isErrorPosts;
  const error = isSearching ? searchError : postsError;

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">
            <span className="home-title-gradient">블로그 게시글</span>
          </h1>
          <p className="home-subtitle">생각과 아이디어를 공유하는 공간</p>
        </div>

        <SearchBar 
          onSearch={handleSearch} 
          className="home-search-bar"
          showSuggestions={true}
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
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">
            <span className="home-title-gradient">블로그 게시글</span>
          </h1>
          <p className="home-subtitle">생각과 아이디어를 공유하는 공간</p>
        </div>

        <SearchBar 
          onSearch={handleSearch} 
          className="home-search-bar"
          showSuggestions={true}
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
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          <span className="home-title-gradient">블로그 게시글</span>
        </h1>
        <p className="home-subtitle">생각과 아이디어를 공유하는 공간</p>
      </div>

      <SearchBar 
        onSearch={handleSearch} 
        className="home-search-bar"
        showSuggestions={true}
      />

      {/* 검색 결과 정보 */}
      {isSearching && (
        <div className="search-results-info">
          <h3 className="search-results-title">
            '{searchQuery}' 검색 결과
          </h3>
          <p className="search-results-count">
            {data ? `${data.length}개의 게시글을 찾았습니다` : "검색 중..."}
          </p>
        </div>
      )}

      {data && data.length === 0 ? (
        <div className="home-empty-state">
          <span className="home-empty-icon">
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
              ? "다른 검색어로 시도해보세요" 
              : "첫 번째 게시글을 작성해보세요!"
            }
          </p>
          {!isSearching && (
            <Link to="/new" className="home-cta-button">
              첫 게시글 작성하기
            </Link>
          )}
          {isSearching && (
            <button 
              onClick={() => handleSearch("")}
              className="home-cta-button"
            >
              전체 게시글 보기
            </button>
          )}
        </div>
      ) : (
        <div className="home-posts-grid">
          {data!.map((post: Post) => (
            <article key={post.id} className={`post-card ${post.isSecret ? 'post-card--secret' : ''}`}>
              <Link to={`/posts/${post.id}`} className="post-card-link">
                <div className="post-card-header">
                  <div className="post-card-title-wrapper">
                    {post.isSecret && (
                      <div className="post-card-secret-badge">
                        <span className="post-card-secret-icon">🔐</span>
                        <span className="post-card-secret-text">비밀글</span>
                      </div>
                    )}
                    <h2 className="post-card-title">
                      {isSearching ? (
                        <HighlightedText text={post.title} highlight={searchQuery} />
                      ) : (
                        post.title
                      )}
                    </h2>
                  </div>
                  {post.author && (
                    <div className="post-card-meta">
                      <span className="post-card-author-avatar">✍️</span>
                      <span className="post-card-author-name">
                        {isSearching ? (
                          <HighlightedText text={post.author.username} highlight={searchQuery} />
                        ) : (
                          post.author.username
                        )}
                      </span>
                      {post.isSecret && post.author.id === user?.id && (
                        <span className="post-card-owner-badge" title="내가 작성한 비밀글">
                          👤
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="post-card-excerpt">
                  {post.isSecret && (!user || post.author?.id !== user.id) ? (
                    <span className="post-card-secret-preview">
                      🔒 비밀글입니다. 클릭하여 비밀번호를 입력해주세요.
                    </span>
                  ) : (
                    isSearching ? (
                      <HighlightedText 
                        text={post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                        highlight={searchQuery}
                      />
                    ) : (
                      post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content
                    )
                  )}
                </p>
                <div className="post-card-footer">
                  <div className="post-card-stats">
                    <span className="post-card-stat">
                      <span className="post-card-stat-icon">💬</span>
                      <span className="post-card-stat-text">댓글</span>
                    </span>
                    <span className="post-card-stat">
                      <span className="post-card-stat-icon">👁️</span>
                      <span className="post-card-stat-text">조회</span>
                    </span>
                  </div>
                  <span className="post-card-read-more">
                    {post.isSecret && (!user || post.author?.id !== user.id) ? (
                      <>
                        <span className="post-card-secret-icon">🔐</span>
                        열기
                      </>
                    ) : (
                      <>
                        읽기 →
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
        <div className="search-tips">
          <h4>💡 검색 팁</h4>
          <ul>
            <li>여러 단어로 검색하면 더 정확한 결과를 얻을 수 있습니다</li>
            <li>제목, 내용, 작성자명에서 모두 검색됩니다</li>
            <li>대소문자는 구분하지 않습니다</li>
            <li>비밀글도 검색 결과에 포함되지만, 작성자가 아닌 경우 내용이 숨겨집니다</li>
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
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }
  });

  return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
}