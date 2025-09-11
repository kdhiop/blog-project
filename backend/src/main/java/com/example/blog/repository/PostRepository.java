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
    
    // 페이징 지원 (최신순)
    @Query("SELECT p FROM Post p ORDER BY p.id DESC")
    Page<Post> findAllOrderByIdDesc(Pageable pageable);
    
    // 전체 조회 (최신순)
    @Query("SELECT p FROM Post p ORDER BY p.id DESC")
    List<Post> findAllOrderByIdDesc();
    
    // 제목 또는 내용으로 검색
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