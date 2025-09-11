package com.example.blog.service;

import com.example.blog.model.Post;
import com.example.blog.model.User;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PostService {
    
    private static final Logger logger = LoggerFactory.getLogger(PostService.class);
    
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)  // 명시적 트랜잭션 설정
    public List<Post> listAll() { 
        try {
            // JOIN FETCH로 Author 정보도 함께 가져와서 Lazy Loading 문제 해결
            List<Post> posts = postRepository.findAllWithAuthor();
            logger.debug("게시글 목록 조회 완료: {} 개", posts.size());
            return posts;
        } catch (Exception e) {
            logger.error("게시글 목록 조회 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("게시글 목록을 불러오는 중 오류가 발생했습니다", e);
        }
    }

    @Transactional(readOnly = true)
    public Post get(Long id) { 
        if (id == null) {
            logger.warn("null ID로 게시글 조회 시도");
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        
        try {
            return postRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글: {}", id);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("게시글 조회 중 오류: postId={}", id, e);
            throw new RuntimeException("게시글을 조회하는 중 오류가 발생했습니다", e);
        }
    }

    @Transactional
    public Post create(Long userId, String title, String content) {
        // 입력값 검증
        validateCreateInput(userId, title, content);
        
        try {
            User author = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 사용자로 게시글 작성 시도: userId={}", userId);
                    return new RuntimeException("사용자를 찾을 수 없습니다");
                });
            
            Post post = new Post();
            post.setTitle(title.trim());
            post.setContent(content.trim());
            post.setAuthor(author);
            
            Post savedPost = postRepository.save(post);
            logger.info("게시글 작성 완료: postId={}, userId={}, title='{}'", 
                       savedPost.getId(), userId, title);
            
            return savedPost;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("게시글 작성 중 오류: userId={}", userId, e);
            throw new RuntimeException("게시글 작성 중 오류가 발생했습니다", e);
        }
    }

    @Transactional
    public Post update(Long id, Long userId, String title, String content) {
        // 입력값 검증
        validateUpdateInput(id, userId, title, content);
        
        try {
            Post post = postRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글 수정 시도: postId={}", id);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
            
            // 작성자 권한 확인
            validateAuthorPermission(post, userId, "수정");
            
            post.setTitle(title.trim());
            post.setContent(content.trim());
            
            Post updatedPost = postRepository.save(post);
            logger.info("게시글 수정 완료: postId={}, userId={}, title='{}'", id, userId, title);
            
            return updatedPost;
            
        } catch (SecurityException | RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("게시글 수정 중 오류: postId={}, userId={}", id, userId, e);
            throw new RuntimeException("게시글 수정 중 오류가 발생했습니다", e);
        }
    }

    @Transactional
    public void delete(Long id, Long userId) {
        // 입력값 검증
        validateDeleteInput(id, userId);
        
        try {
            Post post = postRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글 삭제 시도: postId={}", id);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
            
            // 작성자 권한 확인
            validateAuthorPermission(post, userId, "삭제");
            
            postRepository.deleteById(id);
            logger.info("게시글 삭제 완료: postId={}, userId={}", id, userId);
            
        } catch (SecurityException | RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("게시글 삭제 중 오류: postId={}, userId={}", id, userId, e);
            throw new RuntimeException("게시글 삭제 중 오류가 발생했습니다", e);
        }
    }

    // 입력값 검증 메소드들
    private void validateCreateInput(Long userId, String title, String content) {
        if (userId == null) {
            logger.warn("null 사용자 ID로 게시글 작성 시도");
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        validateTitleAndContent(title, content);
    }

    private void validateUpdateInput(Long id, Long userId, String title, String content) {
        if (id == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        validateTitleAndContent(title, content);
    }

    private void validateDeleteInput(Long id, Long userId) {
        if (id == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
    }

    private void validateTitleAndContent(String title, String content) {
        if (title == null || title.trim().isEmpty()) {
            logger.warn("빈 제목으로 게시글 작업 시도");
            throw new IllegalArgumentException("제목은 필수입니다");
        }
        
        if (content == null || content.trim().isEmpty()) {
            logger.warn("빈 내용으로 게시글 작업 시도");
            throw new IllegalArgumentException("내용은 필수입니다");
        }

        if (title.trim().length() > 100) {
            throw new IllegalArgumentException("제목은 100자를 초과할 수 없습니다");
        }

        if (content.trim().length() > 2000) {
            throw new IllegalArgumentException("내용은 2000자를 초과할 수 없습니다");
        }
    }

    private void validateAuthorPermission(Post post, Long userId, String action) {
        if (post.getAuthor() == null || !post.getAuthor().getId().equals(userId)) {
            logger.warn("권한 없는 게시글 {} 시도: postId={}, userId={}, authorId={}", 
                       action, post.getId(), userId, 
                       post.getAuthor() != null ? post.getAuthor().getId() : null);
            throw new SecurityException("게시글을 " + action + "할 권한이 없습니다");
        }
    }
}