package com.example.blog.service;

import com.example.blog.model.Post;
import com.example.blog.model.User;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {
    
    private static final Logger logger = LoggerFactory.getLogger(PostService.class);
    
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Post> listAll() { 
        try {
            List<Post> posts = postRepository.findAllWithAuthor();
            logger.debug("게시글 목록 조회 완료: {} 개", posts.size());
            return posts;
        } catch (Exception e) {
            logger.error("게시글 목록 조회 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("게시글 목록을 불러오는 중 오류가 발생했습니다", e);
        }
    }

    // *** 검색 기능 추가 ***
    
    @Transactional(readOnly = true)
    public List<Post> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            logger.warn("빈 검색어로 검색 시도");
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        
        String trimmedKeyword = keyword.trim();
        
        // 검색어가 너무 짧은 경우 제한
        if (trimmedKeyword.length() < 2) {
            logger.warn("너무 짧은 검색어: '{}'", trimmedKeyword);
            throw new IllegalArgumentException("검색어는 2자 이상이어야 합니다");
        }
        
        try {
            List<Post> results;
            
            // 다중 키워드 검색 처리 (공백으로 구분)
            String[] keywords = trimmedKeyword.split("\\s+");
            
            if (keywords.length > 1) {
                // 여러 키워드가 있는 경우
                results = searchMultipleKeywords(keywords);
                logger.debug("다중 키워드 검색 완료: '{}' -> {} 개 결과", trimmedKeyword, results.size());
            } else {
                // 단일 키워드 검색
                results = postRepository.findByFullTextSearchWithAuthor(trimmedKeyword);
                logger.debug("단일 키워드 검색 완료: '{}' -> {} 개 결과", trimmedKeyword, results.size());
            }
            
            return results;
            
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("검색 중 오류 발생: keyword='{}'", trimmedKeyword, e);
            throw new RuntimeException("검색 중 오류가 발생했습니다", e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<Post> searchByTitle(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        
        try {
            List<Post> results = postRepository.findByTitleContainingIgnoreCaseWithAuthor(keyword.trim());
            logger.debug("제목 검색 완료: '{}' -> {} 개 결과", keyword, results.size());
            return results;
        } catch (Exception e) {
            logger.error("제목 검색 중 오류: keyword='{}'", keyword, e);
            throw new RuntimeException("제목 검색 중 오류가 발생했습니다", e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<Post> searchByContent(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        
        try {
            List<Post> results = postRepository.findByContentContainingIgnoreCaseWithAuthor(keyword.trim());
            logger.debug("내용 검색 완료: '{}' -> {} 개 결과", keyword, results.size());
            return results;
        } catch (Exception e) {
            logger.error("내용 검색 중 오류: keyword='{}'", keyword, e);
            throw new RuntimeException("내용 검색 중 오류가 발생했습니다", e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<Post> searchByAuthor(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        
        try {
            List<Post> results = postRepository.findByAuthorUsernameContainingIgnoreCaseWithAuthor(keyword.trim());
            logger.debug("작성자 검색 완료: '{}' -> {} 개 결과", keyword, results.size());
            return results;
        } catch (Exception e) {
            logger.error("작성자 검색 중 오류: keyword='{}'", keyword, e);
            throw new RuntimeException("작성자 검색 중 오류가 발생했습니다", e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<Post> searchRecent(String keyword, int limit) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        
        try {
            Pageable pageable = PageRequest.of(0, Math.max(1, Math.min(limit, 50))); // 최대 50개로 제한
            List<Post> results = postRepository.findTopByKeywordWithAuthor(keyword.trim(), pageable);
            logger.debug("최근 검색 완료: '{}' -> {} 개 결과 (limit={})", keyword, results.size(), limit);
            return results;
        } catch (Exception e) {
            logger.error("최근 검색 중 오류: keyword='{}', limit={}", keyword, limit, e);
            throw new RuntimeException("최근 검색 중 오류가 발생했습니다", e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<Post> searchSince(String keyword, LocalDateTime since) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        if (since == null) {
            throw new IllegalArgumentException("기준 날짜는 필수입니다");
        }
        
        try {
            List<Post> results = postRepository.findByKeywordAndDateAfterWithAuthor(keyword.trim(), since);
            logger.debug("날짜 제한 검색 완료: '{}' since {} -> {} 개 결과", keyword, since, results.size());
            return results;
        } catch (Exception e) {
            logger.error("날짜 제한 검색 중 오류: keyword='{}', since={}", keyword, since, e);
            throw new RuntimeException("날짜 제한 검색 중 오류가 발생했습니다", e);
        }
    }
    
    // 다중 키워드 검색 처리 (private 메소드)
    private List<Post> searchMultipleKeywords(String[] keywords) {
        if (keywords.length == 0) {
            return List.of();
        }
        
        // 첫 번째 키워드로 검색
        List<Post> results = postRepository.findByFullTextSearchWithAuthor(keywords[0]);
        
        // 나머지 키워드들로 필터링 (메모리에서 처리)
        for (int i = 1; i < keywords.length; i++) {
            final String keyword = keywords[i].toLowerCase();
            results = results.stream()
                .filter(post -> 
                    post.getTitle().toLowerCase().contains(keyword) ||
                    post.getContent().toLowerCase().contains(keyword) ||
                    (post.getAuthor() != null && post.getAuthor().getUsername().toLowerCase().contains(keyword))
                )
                .collect(Collectors.toList());
        }
        
        return results;
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
        validateUpdateInput(id, userId, title, content);
        
        try {
            Post post = postRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글 수정 시도: postId={}", id);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
            
            validateAuthorPermission(post, userId, "수정");
            
            post.setTitle(title.trim());
            post.setContent(content.trim());
            
            Post updatedPost = postRepository.save(post);
            logger.info("게시글 수정 완료: postId={}, userId={}, title='{}'", id, userId, title);
            
            return postRepository.findByIdWithAuthor(updatedPost.getId())
                .orElse(updatedPost);
            
        } catch (SecurityException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("게시글 수정 중 오류: postId={}, userId={}", id, userId, e);
            throw new RuntimeException("게시글 수정 중 오류가 발생했습니다", e);
        }
    }

    @Transactional
    public void delete(Long id, Long userId) {
        validateDeleteInput(id, userId);
        
        try {
            Post post = postRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글 삭제 시도: postId={}", id);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
            
            validateAuthorPermission(post, userId, "삭제");
            
            postRepository.deleteById(id);
            logger.info("게시글 삭제 완료: postId={}, userId={}", id, userId);
            
        } catch (SecurityException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (RuntimeException e) {
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