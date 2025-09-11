// CommentService.java
package com.example.blog.service;

import com.example.blog.model.Comment;
import com.example.blog.model.Post;
import com.example.blog.model.User;
import com.example.blog.repository.CommentRepository;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CommentService {
    
    private static final Logger logger = LoggerFactory.getLogger(CommentService.class);
    
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Comment> listByPost(Long postId) {
        if (postId == null) {
            logger.warn("null postId로 댓글 목록 조회 시도");
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        
        try {
            List<Comment> comments = commentRepository.findByPostId(postId);
            logger.debug("댓글 목록 조회 완료: postId={}, count={}", postId, comments.size());
            return comments;
        } catch (Exception e) {
            logger.error("댓글 목록 조회 중 오류: postId={}", postId, e);
            throw new RuntimeException("댓글 목록을 불러오는 중 오류가 발생했습니다");
        }
    }

    public Comment add(Long postId, Long userId, String content) {
        // 입력값 검증
        if (postId == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("댓글 내용은 필수입니다");
        }
        
        try {
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글에 댓글 작성 시도: postId={}", postId);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
            
            User author = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 사용자의 댓글 작성 시도: userId={}", userId);
                    return new RuntimeException("사용자를 찾을 수 없습니다");
                });
            
            Comment comment = new Comment();
            comment.setContent(content.trim());
            comment.setPost(post);
            comment.setAuthor(author);
            
            Comment savedComment = commentRepository.save(comment);
            logger.info("댓글 작성 완료: commentId={}, postId={}, userId={}", 
                       savedComment.getId(), postId, userId);
            
            return savedComment;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("댓글 작성 중 오류: postId={}, userId={}", postId, userId, e);
            throw new RuntimeException("댓글 작성 중 오류가 발생했습니다");
        }
    }

    public Comment update(Long commentId, Long userId, String content) {
        // 입력값 검증
        if (commentId == null) {
            throw new IllegalArgumentException("댓글 ID는 필수입니다");
        }
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("댓글 내용은 필수입니다");
        }
        
        try {
            Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 댓글 수정 시도: commentId={}", commentId);
                    return new RuntimeException("댓글을 찾을 수 없습니다");
                });
            
            // 작성자 권한 확인 - SecurityException을 먼저 처리
            if (comment.getAuthor() == null || !comment.getAuthor().getId().equals(userId)) {
                logger.warn("권한 없는 댓글 수정 시도: commentId={}, userId={}, authorId={}", 
                           commentId, userId, comment.getAuthor() != null ? comment.getAuthor().getId() : null);
                throw new SecurityException("댓글을 수정할 권한이 없습니다");
            }
            
            comment.setContent(content.trim());
            
            Comment updatedComment = commentRepository.save(comment);
            logger.info("댓글 수정 완료: commentId={}, userId={}", commentId, userId);
            
            return updatedComment;
            
        } catch (SecurityException e) {
            // SecurityException을 먼저 처리
            throw e;
        } catch (RuntimeException e) {
            // 다른 RuntimeException들 처리
            throw e;
        } catch (Exception e) {
            logger.error("댓글 수정 중 오류: commentId={}, userId={}", commentId, userId, e);
            throw new RuntimeException("댓글 수정 중 오류가 발생했습니다");
        }
    }

    public void delete(Long commentId, Long userId) {
        // 입력값 검증
        if (commentId == null) {
            throw new IllegalArgumentException("댓글 ID는 필수입니다");
        }
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        
        try {
            Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 댓글 삭제 시도: commentId={}", commentId);
                    return new RuntimeException("댓글을 찾을 수 없습니다");
                });
            
            // 작성자 권한 확인 - SecurityException을 먼저 처리
            if (comment.getAuthor() == null || !comment.getAuthor().getId().equals(userId)) {
                logger.warn("권한 없는 댓글 삭제 시도: commentId={}, userId={}, authorId={}", 
                           commentId, userId, comment.getAuthor() != null ? comment.getAuthor().getId() : null);
                throw new SecurityException("댓글을 삭제할 권한이 없습니다");
            }
            
            commentRepository.deleteById(commentId);
            logger.info("댓글 삭제 완료: commentId={}, userId={}", commentId, userId);
            
        } catch (SecurityException e) {
            // SecurityException을 먼저 처리
            throw e;
        } catch (RuntimeException e) {
            // 다른 RuntimeException들 처리
            throw e;
        } catch (Exception e) {
            logger.error("댓글 삭제 중 오류: commentId={}, userId={}", commentId, userId, e);
            throw new RuntimeException("댓글 삭제 중 오류가 발생했습니다");
        }
    }
}