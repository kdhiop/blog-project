package com.example.blog.repository;

import com.example.blog.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // 기존 메소드 (하위 호환성 유지)
    List<Comment> findByPostId(Long postId);
    
    // JOIN FETCH를 사용하여 Author 정보도 함께 가져오기 (N+1 문제 해결)
    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.post.id = :postId ORDER BY c.id ASC")
    List<Comment> findByPostIdWithAuthor(@Param("postId") Long postId);
    
    // ID로 댓글 조회 시 Author 정보도 함께 가져오기
    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.id = :id")
    Optional<Comment> findByIdWithAuthor(@Param("id") Long id);
}