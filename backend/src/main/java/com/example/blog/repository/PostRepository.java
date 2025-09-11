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
    
    // 페이징 지원
    Page<Post> findAllByOrderByIdDesc(Pageable pageable);
    
    // 제목 또는 내용으로 검색
    @Query("SELECT p FROM Post p WHERE p.title LIKE %:keyword% OR p.content LIKE %:keyword% ORDER BY p.id DESC")
    List<Post> findByKeyword(@Param("keyword") String keyword);
    
    // 특정 작성자의 게시글 조회
    List<Post> findByAuthorIdOrderByIdDesc(Long authorId);
    
    // Join Fetch로 성능 최적화
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author WHERE p.id = :id")
    Optional<Post> findByIdWithAuthor(@Param("id") Long id);
}