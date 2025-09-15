package com.example.blog.service;

import com.example.blog.model.Post;
import com.example.blog.model.User;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
    private final BCryptPasswordEncoder passwordEncoder;

    public PostService(PostRepository postRepository, UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Post> listAll() { 
        try {
            // 공개 게시글만 조회 (비밀글 제외)
            List<Post> posts = postRepository.findAllPublicWithAuthor();
            logger.debug("공개 게시글 목록 조회 완료: {} 개", posts.size());
            return posts;
        } catch (Exception e) {
            logger.error("게시글 목록 조회 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("게시글 목록을 불러오는 중 오류가 발생했습니다", e);
        }
    }

    @Transactional(readOnly = true)
    public List<Post> listAllIncludingSecret() {
        try {
            // 모든 게시글 조회 (비밀글 포함) - 관리자용
            List<Post> posts = postRepository.findAllWithAuthor();
            logger.debug("전체 게시글 목록 조회 완료: {} 개", posts.size());
            return posts;
        } catch (Exception e) {
            logger.error("전체 게시글 목록 조회 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("게시글 목록을 불러오는 중 오류가 발생했습니다", e);
        }
    }

    // *** 검색 기능 - 공개 게시글만 검색 ***
    
    @Transactional(readOnly = true)
    public List<Post> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            logger.warn("빈 검색어로 검색 시도");
            throw new IllegalArgumentException("검색어는 필수입니다");
        }
        
        String trimmedKeyword = keyword.trim();
        
        if (trimmedKeyword.length() < 2) {
            logger.warn("너무 짧은 검색어: '{}'", trimmedKeyword);
            throw new IllegalArgumentException("검색어는 2자 이상이어야 합니다");
        }
        
        try {
            List<Post> results;
            
            String[] keywords = trimmedKeyword.split("\\s+");
            
            if (keywords.length > 1) {
                results = searchMultipleKeywords(keywords);
                logger.debug("다중 키워드 검색 완료: '{}' -> {} 개 결과", trimmedKeyword, results.size());
            } else {
                // 공개 게시글에서만 검색
                results = postRepository.findByFullTextSearchPublicWithAuthor(trimmedKeyword);
                logger.debug("공개 게시글 검색 완료: '{}' -> {} 개 결과", trimmedKeyword, results.size());
            }
            
            return results;
            
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("검색 중 오류 발생: keyword='{}'", trimmedKeyword, e);
            throw new RuntimeException("검색 중 오류가 발생했습니다", e);
        }
    }
    
    // 다중 키워드 검색 처리 (공개 게시글만)
    private List<Post> searchMultipleKeywords(String[] keywords) {
        if (keywords.length == 0) {
            return List.of();
        }
        
        // 첫 번째 키워드로 공개 게시글에서 검색
        List<Post> results = postRepository.findByFullTextSearchPublicWithAuthor(keywords[0]);
        
        // 나머지 키워드들로 필터링
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

    // 비밀글 비밀번호 확인
    @Transactional(readOnly = true)
    public boolean verifySecretPassword(Long postId, String password) {
        if (postId == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호는 필수입니다");
        }

        try {
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다"));

            if (!Boolean.TRUE.equals(post.getIsSecret())) {
                logger.warn("비밀글이 아닌 게시글에 대한 비밀번호 확인 시도: postId={}", postId);
                return true; // 비밀글이 아니면 접근 허용
            }

            if (post.getSecretPassword() == null) {
                logger.warn("비밀번호가 설정되지 않은 비밀글: postId={}", postId);
                return false;
            }

            boolean matches = passwordEncoder.matches(password.trim(), post.getSecretPassword());
            logger.debug("비밀글 비밀번호 확인: postId={}, 결과={}", postId, matches);
            
            return matches;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("비밀글 비밀번호 확인 중 오류: postId={}", postId, e);
            throw new RuntimeException("비밀번호 확인 중 오류가 발생했습니다", e);
        }
    }

    @Transactional
    public Post create(Long userId, String title, String content, Boolean isSecret, String secretPassword) {
        validateCreateInput(userId, title, content, isSecret, secretPassword);
        
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
            post.setIsSecret(Boolean.TRUE.equals(isSecret));
            post.setCreatedAt(LocalDateTime.now());
            post.setUpdatedAt(LocalDateTime.now());
            
            // 비밀글인 경우 비밀번호 암호화하여 저장
            if (Boolean.TRUE.equals(isSecret) && secretPassword != null && !secretPassword.trim().isEmpty()) {
                post.setSecretPassword(passwordEncoder.encode(secretPassword.trim()));
            }
            
            Post savedPost = postRepository.save(post);
            logger.info("게시글 작성 완료: postId={}, userId={}, title='{}', isSecret={}", 
                       savedPost.getId(), userId, title, isSecret);
            
            return postRepository.findByIdWithAuthor(savedPost.getId())
                .orElse(savedPost);
            
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("게시글 작성 중 오류: userId={}", userId, e);
            throw new RuntimeException("게시글 작성 중 오류가 발생했습니다", e);
        }
    }

    @Transactional
    public Post update(Long id, Long userId, String title, String content, Boolean isSecret, String secretPassword) {
        validateUpdateInput(id, userId, title, content, isSecret, secretPassword);
        
        try {
            Post post = postRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 게시글 수정 시도: postId={}", id);
                    return new RuntimeException("게시글을 찾을 수 없습니다");
                });
            
            validateAuthorPermission(post, userId, "수정");
            
            post.setTitle(title.trim());
            post.setContent(content.trim());
            post.setIsSecret(Boolean.TRUE.equals(isSecret));
            post.setUpdatedAt(LocalDateTime.now());
            
            // 비밀글 설정 처리
            if (Boolean.TRUE.equals(isSecret)) {
                // 비밀글로 설정하는 경우
                if (secretPassword != null && !secretPassword.trim().isEmpty()) {
                    // 새 비밀번호가 제공된 경우 암호화하여 저장
                    post.setSecretPassword(passwordEncoder.encode(secretPassword.trim()));
                } else if (post.getSecretPassword() == null) {
                    // 기존 비밀번호가 없고 새 비밀번호도 없는 경우 오류
                    throw new IllegalArgumentException("비밀글에는 비밀번호가 필요합니다");
                }
                // 기존 비밀번호가 있고 새 비밀번호가 없는 경우 기존 비밀번호 유지
            } else {
                // 공개글로 설정하는 경우 비밀번호 제거
                post.setSecretPassword(null);
            }
            
            Post updatedPost = postRepository.save(post);
            logger.info("게시글 수정 완료: postId={}, userId={}, title='{}', isSecret={}", id, userId, title, isSecret);
            
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

    // *** 편의 메소드들 (기존 API와의 호환성) ***
    
    public Post create(Long userId, String title, String content) {
        return create(userId, title, content, false, null);
    }

    public Post update(Long id, Long userId, String title, String content) {
        return update(id, userId, title, content, false, null);
    }

    // 입력값 검증 메소드들
    private void validateCreateInput(Long userId, String title, String content, Boolean isSecret, String secretPassword) {
        if (userId == null) {
            logger.warn("null 사용자 ID로 게시글 작성 시도");
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        validateTitleAndContent(title, content);
        validateCreateSecretSettings(isSecret, secretPassword); // 새로 작성 시에는 비밀번호 필수
    }

    private void validateUpdateInput(Long id, Long userId, String title, String content, Boolean isSecret, String secretPassword) {
        if (id == null) {
            throw new IllegalArgumentException("게시글 ID는 필수입니다");
        }
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        validateTitleAndContent(title, content);
        validateSecretSettings(isSecret, secretPassword);
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

    private void validateSecretSettings(Boolean isSecret, String secretPassword) {
        if (Boolean.TRUE.equals(isSecret)) {
            // 비밀글로 설정하는 경우 비밀번호 검증 (수정 시에는 기존 비밀번호 유지 가능)
            if (secretPassword != null && !secretPassword.trim().isEmpty()) {
                String trimmed = secretPassword.trim();
                if (trimmed.length() < 1) {
                    throw new IllegalArgumentException("비밀글 비밀번호는 1자 이상이어야 합니다");
                }
                
                if (trimmed.length() > 50) {
                    throw new IllegalArgumentException("비밀글 비밀번호는 50자를 초과할 수 없습니다");
                }
            }
        }
    }

    // 새로 작성하는 비밀글에 대한 비밀번호 필수 검증 (create 전용)
    private void validateCreateSecretSettings(Boolean isSecret, String secretPassword) {
        if (Boolean.TRUE.equals(isSecret)) {
            if (secretPassword == null || secretPassword.trim().isEmpty()) {
                throw new IllegalArgumentException("비밀글에는 비밀번호가 필요합니다");
            }
            
            String trimmed = secretPassword.trim();
            if (trimmed.length() < 1) {
                throw new IllegalArgumentException("비밀글 비밀번호는 1자 이상이어야 합니다");
            }
            
            if (trimmed.length() > 50) {
                throw new IllegalArgumentException("비밀글 비밀번호는 50자를 초과할 수 없습니다");
            }
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

    // *** 하위 호환성을 위한 기존 메소드들 ***
    
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
            Pageable pageable = PageRequest.of(0, Math.max(1, Math.min(limit, 50)));
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
}