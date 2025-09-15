import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "게시글을 검색하세요...", 
  className = "",
  showSuggestions = false 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // URL에서 검색어 초기화
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setQuery(searchQuery);
      setIsExpanded(true);
    }
  }, [location.search]);

  // 최근 검색어 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('최근 검색어 로드 실패:', error);
    }
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      const trimmedQuery = searchQuery.trim();
      const updated = [
        trimmedQuery,
        ...recentSearches.filter(item => item !== trimmedQuery)
      ].slice(0, 5); // 최대 5개 저장

      setRecentSearches(updated);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.warn('최근 검색어 저장 실패:', error);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery.length < 2) {
      alert("검색어는 2자 이상 입력해주세요.");
      return;
    }

    if (trimmedQuery.length > 100) {
      alert("검색어는 100자를 초과할 수 없습니다.");
      return;
    }

    saveRecentSearch(trimmedQuery);
    onSearch(trimmedQuery);
    setShowRecentSearches(false);

    // URL에 검색어 반영
    const searchParams = new URLSearchParams();
    searchParams.set('search', trimmedQuery);
    navigate(`/?${searchParams.toString()}`, { replace: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // 실시간 검색 (디바운싱 없이, 간단한 버전)
    if (value.trim().length === 0) {
      onSearch(""); // 빈 검색어면 전체 목록 표시
    }
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
    if (showSuggestions && recentSearches.length > 0) {
      setShowRecentSearches(true);
    }
  };

  const handleInputBlur = () => {
    // 약간의 딜레이를 두어 클릭 이벤트가 처리되도록 함
    setTimeout(() => {
      setShowRecentSearches(false);
      if (!query.trim()) {
        setIsExpanded(false);
      }
    }, 200);
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recent-searches');
    } catch (error) {
      console.warn('최근 검색어 삭제 실패:', error);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    onSearch("");
    setIsExpanded(false);
    
    // URL에서 검색 파라미터 제거
    navigate("/", { replace: true });
    
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return (
    <div className={`search-bar-container ${className}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className={`search-input-wrapper ${isExpanded ? 'search-input-wrapper--expanded' : ''}`}>
          <div className="search-input-container">
            <span className="search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className="search-input"
              autoComplete="off"
              maxLength={100}
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="search-clear-btn"
                title="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="search-submit-btn"
            disabled={query.trim().length < 2}
            title="검색"
          >
            검색
          </button>
        </div>

        {/* 최근 검색어 드롭다운 */}
        {showSuggestions && showRecentSearches && recentSearches.length > 0 && (
          <div className="search-suggestions">
            <div className="search-suggestions-header">
              <span className="search-suggestions-title">최근 검색어</span>
              <button
                type="button"
                onClick={handleClearRecentSearches}
                className="search-suggestions-clear"
              >
                전체 삭제
              </button>
            </div>
            <ul className="search-suggestions-list">
              {recentSearches.map((item, index) => (
                <li key={index} className="search-suggestion-item">
                  <button
                    type="button"
                    onClick={() => handleRecentSearchClick(item)}
                    className="search-suggestion-btn"
                  >
                    <span className="search-suggestion-icon">🕒</span>
                    <span className="search-suggestion-text">{item}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}