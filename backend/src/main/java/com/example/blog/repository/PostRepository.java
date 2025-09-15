package com.example.blog.repository;

import com.example.blog.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    
    // *** 공개 게시글만 조회하는 메소드들 (비밀글 제외) ***
    
    // 공개 게시글만 전체 조회 (Author 정보 포함)
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author WHERE p.isSecret = false ORDER BY p.id DESC")
    List<Post> findAllPublicWithAuthor();
    
    // 전체 조회 (비밀글 포함, Author 정보 포함) - 관리자용
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author ORDER BY p.id DESC")
    List<Post> findAllWithAuthor();
    
    // 공개 게시글만 페이징 조회
    @Query("SELECT p FROM Post p WHERE p.isSecret = false ORDER BY p.id DESC")
    Page<Post> findAllPublicOrderByIdDesc(Pageable pageable);
    
    // 전체 조회 (기존) - 하위 호환성 유지
    @Query("SELECT p FROM Post p ORDER BY p.id DESC")
    List<Post> findAllOrderByIdDesc();
    
    // *** 검색 기능 - 공개 게시글만 검색 ***
    
    // 공개 게시글에서 제목 또는 내용으로 검색
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author " +
           "WHERE p.isSecret = false AND (" +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.id DESC")
    List<Post> findByKeywordPublicWithAuthor(@Param("keyword") String keyword);
    
    // 공개 게시글에서 전체 텍스트 검색 (제목, 내용, 작성자명)
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author a " +
           "WHERE p.isSecret = false AND (" +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.id DESC")
    List<Post> findByFullTextSearchPublicWithAuthor(@Param("keyword") String keyword);
    
    // *** 기존 검색 메소드들 (전체 게시글 대상) ***
    
    // 제목 또는 내용으로 검색 (비밀글 포함)
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author " +
           "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    List<Post> findByKeywordWithAuthor(@Param("keyword") String keyword);
    
    // 제목으로만 검색
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author " +
           "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    List<Post> findByTitleContainingIgnoreCaseWithAuthor(@Param("keyword") String keyword);
    
    // 내용으로만 검색
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author " +
           "WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    List<Post> findByContentContainingIgnoreCaseWithAuthor(@Param("keyword") String keyword);
    
    // 작성자명으로 검색
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author a " +
           "WHERE LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    List<Post> findByAuthorUsernameContainingIgnoreCaseWithAuthor(@Param("keyword") String keyword);
    
    // 전체 텍스트 검색 (제목, 내용, 작성자명 모두 포함)
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author a " +
           "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    List<Post> findByFullTextSearchWithAuthor(@Param("keyword") String keyword);
    
    // 고급 검색 - 여러 키워드 지원 (공백으로 구분)
    @Query("SELECT DISTINCT p FROM Post p LEFT JOIN FETCH p.author a " +
           "WHERE (" +
           "  LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword1, '%')) " +
           "  OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword1, '%')) " +
           "  OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword1, '%'))" +
           ") AND (" +
           "  LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword2, '%')) " +
           "  OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword2, '%')) " +
           "  OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword2, '%'))" +
           ") ORDER BY p.id DESC")
    List<Post> findByMultipleKeywordsWithAuthor(@Param("keyword1") String keyword1, @Param("keyword2") String keyword2);
    
    // 날짜 범위와 함께 검색
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author " +
           "WHERE (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND p.createdAt >= :startDate " +
           "ORDER BY p.id DESC")
    List<Post> findByKeywordAndDateAfterWithAuthor(@Param("keyword") String keyword, 
                                                   @Param("startDate") java.time.LocalDateTime startDate);
    
    // 검색 결과 개수 제한 (상위 N개)
    @Query(value = "SELECT p FROM Post p LEFT JOIN FETCH p.author " +
           "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    List<Post> findTopByKeywordWithAuthor(@Param("keyword") String keyword, Pageable pageable);
    
    // 페이징을 지원하는 검색
    @Query("SELECT p FROM Post p " +
           "WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY p.id DESC")
    Page<Post> findByKeywordPaged(@Param("keyword") String keyword, Pageable pageable);
    
    // *** 기존 메소드들 (하위 호환성 유지) ***
    
    // 제목 또는 내용으로 검색 (기존 메소드)
    @Query("SELECT p FROM Post p WHERE p.title LIKE %:keyword% OR p.content LIKE %:keyword% ORDER BY p.id DESC")
    List<Post> findByKeyword(@Param("keyword") String keyword);
    
    // 특정 작성자의 게시글 조회
    @Query("SELECT p FROM Post p WHERE p.author.id = :authorId ORDER BY p.id DESC")
    List<Post> findByAuthorIdOrderByIdDesc(@Param("authorId") Long authorId);
    
    // Join Fetch로 성능 최적화 (작성자 정보 포함)
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author WHERE p.id = :id")
    Optional<Post> findByIdWithAuthor(@Param("id") Long id);
    
    // 작성자 정보와 댓글 수를 함께 조회
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author LEFT JOIN FETCH p.comments WHERE p.id = :id")
    Optional<Post> findByIdWithAuthorAndComments(@Param("id") Long id);
}