package com.example.blog.service;

import com.example.blog.model.Post;
import com.example.blog.model.User;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional // 🔧 클래스 레벨에 @Transactional 추가
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PostService(PostRepository postRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 전체 게시글 목록 조회 (비밀글 포함)
    @Transactional(readOnly = true)
    public List<Post> listAll() {
        logger.debug("전체 게시글 목록 조회 요청 (비밀글 포함)");
        List<Post> posts = postRepository.findAllWithAuthor();
        logger.info("게시글 목록 조회 완료: 총 {}개 (비밀글 포함)", posts.size());
        return posts;
    }

    // 공개글만 검색
    @Transactional(readOnly = true)
    public List<Post> searchPublicPosts(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            logger.warn("빈 검색어로 공개글 검색 시도");
            throw new IllegalArgumentException("검색어를 입력해주세요");
        }
        
        String trimmedKeyword = keyword.trim();
        if (trimmedKeyword.length() < 2) {
            logger.warn("너무 짧은 검색어: '{}'", trimmedKeyword);
            throw new IllegalArgumentException("검색어는 2자 이상이어야 합니다");
        }
        
        logger.info("공개글 검색: keyword='{}'", trimmedKeyword);
        
        try {
            List<Post> searchResults = postRepository.findByKeywordPublicWithAuthor(trimmedKeyword);
            logger.info("공개글 검색 완료: keyword='{}', 결과={}개", trimmedKeyword, searchResults.size());
            return searchResults;
        } catch (Exception e) {
            logger.error("공개글 검색 중 오류 발생: keyword='{}'", trimmedKeyword, e);
            throw new RuntimeException("검색 처리 중 오류가 발생했습니다");
        }
    }

    // 전체 검색 (비밀글 포함)
    @Transactional(readOnly = true)
    public List<Post> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            logger.warn("빈 검색어로 검색 시도");
            throw new IllegalArgumentException("검색어를 입력해주세요");
        }
        
        String trimmedKeyword = keyword.trim();
        if (trimmedKeyword.length() < 2) {
            logger.warn("너무 짧은 검색어: '{}'", trimmedKeyword);
            throw new IllegalArgumentException("검색어는 2자 이상이어야 합니다");
        }
        
        logger.info("전체 게시글 검색: keyword='{}'", trimmedKeyword);
        
        try {
            List<Post> searchResults = postRepository.findByFullTextSearchWithAuthor(trimmedKeyword);
            
            long secretPostCount = searchResults.stream()
                .mapToLong(post -> Boolean.TRUE.equals(post.getIsSecret()) ? 1L : 0L)
                .sum();
            
            logger.info("전체 검색 완료: keyword='{}', 총 결과={}개, 비밀글={}개", 
                       trimmedKeyword, searchResults.size(), secretPostCount);
            
            return searchResults;
        } catch (Exception e) {
            logger.error("검색 중 오류 발생: keyword='{}'", trimmedKeyword, e);
            throw new RuntimeException("검색 처리 중 오류가 발생했습니다");
        }
    }

    // 🔧 게시글 상세 조회 - 완전히 새로 작성
    @Transactional(readOnly = true)
    public Post get(Long id, Long currentUserId) {
        logger.debug("게시글 상세 조회: postId={}, currentUserId={}", id, currentUserId);
        
        // JOIN FETCH로 author 정보를 미리 로드
        Post post = postRepository.findByIdWithAuthor(id)
            .orElseThrow(() -> {
                logger.warn("게시글을 찾을 수 없음: postId={}", id);
                return new RuntimeException("게시글을 찾을 수 없습니다");
            });
        
        // 🔧 hasAccess 설정 로직 개선
        if (Boolean.TRUE.equals(post.getIsSecret())) {
            // 비밀글인 경우
            boolean isAuthor = currentUserId != null && 
                post.getAuthor() != null && 
                post.getAuthor().getId().equals(currentUserId);
            
            post.setHasAccess(isAuthor); // 작성자면 true, 아니면 false
            
            logger.info("비밀글 접근 권한 설정: postId={}, isAuthor={}, hasAccess={}", 
                       id, isAuthor, post.getHasAccess());
        } else {
            // 공개글인 경우 모두 접근 가능
            post.setHasAccess(true);
            logger.debug("공개글 접근: postId={}", id);
        }
        
        logger.info("게시글 조회 성공: postId={}, title={}, isSecret={}, hasAccess={}", 
                   id, post.getTitle(), post.getIsSecret(), post.getHasAccess());
        
        return post;
    }

    // 🔧 편의 메소드 - currentUserId 없는 버전
    @Transactional(readOnly = true)
    public Post get(Long id) {
        return get(id, null);
    }

    // 🔧 비밀글 비밀번호 확인 - 수정
    @Transactional(readOnly = true)
    public boolean verifySecretPassword(Long postId, String password) {
        if (password == null || password.trim().isEmpty()) {
            logger.warn("빈 비밀번호로 비밀글 접근 시도: postId={}", postId);
            throw new IllegalArgumentException("비밀번호를 입력해주세요");
        }

        Post post = postRepository.findById(postId)
            .orElseThrow(() -> {
                logger.warn("존재하지 않는 게시글에 대한 비밀번호 확인 시도: postId={}", postId);
                return new RuntimeException("게시글을 찾을 수 없습니다");
            });

        if (!Boolean.TRUE.equals(post.getIsSecret())) {
            logger.warn("비밀글이 아닌 게시글에 대한 비밀번호 확인 시도: postId={}", postId);
            throw new IllegalArgumentException("비밀글이 아닙니다");
        }

        if (post.getSecretPassword() == null) {
            logger.error("비밀글이지만 비밀번호가 설정되지 않음: postId={}", postId);
            throw new RuntimeException("비밀글 설정에 오류가 있습니다");
        }

        boolean isValid = passwordEncoder.matches(password.trim(), post.getSecretPassword());
        
        if (isValid) {
            logger.info("비밀글 비밀번호 확인 성공: postId={}", postId);
        } else {
            logger.warn("비밀글 비밀번호 불일치: postId={}", postId);
        }

        return isValid;
    }

    // 🔧 비밀번호 확인 후 게시글 반환 - 새로운 메소드
    @Transactional(readOnly = true)
    public Post getSecretPostWithPassword(Long postId, String password, Long currentUserId) {
        logger.info("비밀글 비밀번호 확인 요청: postId={}, currentUserId={}", postId, currentUserId);
        
        // 먼저 비밀번호 확인
        boolean isValid = verifySecretPassword(postId, password);
        
        if (!isValid) {
            throw new SecurityException("비밀번호가 일치하지 않습니다");
        }
        
        // 비밀번호가 맞으면 게시글을 다시 가져와서 hasAccess를 true로 설정
        Post post = postRepository.findByIdWithAuthor(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다"));
        
        // 🔧 비밀번호가 맞으므로 접근 허용
        post.setHasAccess(true);
        
        logger.info("비밀글 비밀번호 확인 완료: postId={}, hasAccess={}", postId, post.getHasAccess());
        
        return post;
    }

    // 게시글 생성
    @Transactional
    public Post create(Long authorId, String title, String content, Boolean isSecret, String secretPassword) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("제목은 필수입니다");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("내용은 필수입니다");
        }

        User author = userRepository.findById(authorId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Post post = new Post();
        post.setTitle(title.trim());
        post.setContent(content.trim());
        post.setAuthor(author);
        post.setIsSecret(Boolean.TRUE.equals(isSecret));

        // 비밀글인 경우 비밀번호 암호화
        if (Boolean.TRUE.equals(isSecret)) {
            if (secretPassword == null || secretPassword.trim().isEmpty()) {
                throw new IllegalArgumentException("비밀글에는 비밀번호가 필요합니다");
            }
            post.setSecretPassword(passwordEncoder.encode(secretPassword.trim()));
            logger.info("비밀글 생성: authorId={}, title={}", authorId, title);
        } else {
            logger.info("공개글 생성: authorId={}, title={}", authorId, title);
        }

        Post savedPost = postRepository.save(post);
        
        // 🔧 중요: 작성자는 항상 자신의 글에 접근 가능하도록 설정
        savedPost.setHasAccess(true);
        
        logger.info("게시글 생성 완료: postId={}, isSecret={}, hasAccess={}", 
                   savedPost.getId(), savedPost.getIsSecret(), savedPost.getHasAccess());
        
        return savedPost;
    }

    // 🔧 게시글 수정 - Lazy Loading 문제 해결
    public Post update(Long id, Long authorId, String title, String content, Boolean isSecret, String secretPassword) {
        // JOIN FETCH로 author 정보를 미리 로드
        Post post = postRepository.findByIdWithAuthor(id)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다"));

        // 🔧 User 객체가 이미 로드되어 있으므로 안전하게 접근 가능
        if (!post.getAuthor().getId().equals(authorId)) {
            logger.warn("권한 없는 게시글 수정 시도: postId={}, authorId={}, actualAuthorId={}", 
                       id, authorId, post.getAuthor().getId());
            throw new SecurityException("작성자만 수정할 수 있습니다");
        }

        if (title != null) post.setTitle(title.trim());
        if (content != null) post.setContent(content.trim());

        // 비밀글 설정 변경
        boolean wasSecret = Boolean.TRUE.equals(post.getIsSecret());
        boolean willBeSecret = Boolean.TRUE.equals(isSecret);

        post.setIsSecret(willBeSecret);

        if (willBeSecret) {
            // 비밀글로 변경하거나 이미 비밀글인 경우
            if (secretPassword != null && !secretPassword.trim().isEmpty()) {
                // 새 비밀번호가 제공된 경우
                post.setSecretPassword(passwordEncoder.encode(secretPassword.trim()));
                logger.info("비밀글 비밀번호 변경: postId={}", id);
            } else if (!wasSecret) {
                // 공개글에서 비밀글로 변경하는데 비밀번호가 없는 경우
                throw new IllegalArgumentException("비밀글로 변경하려면 비밀번호가 필요합니다");
            }
            // 이미 비밀글이고 새 비밀번호가 없으면 기존 비밀번호 유지
        } else {
            // 공개글로 변경
            if (wasSecret) {
                post.setSecretPassword(null);
                logger.info("비밀글을 공개글로 변경: postId={}", id);
            }
        }

        Post updatedPost = postRepository.save(post);
        // 🔧 작성자는 수정한 게시글에 항상 접근 가능
        updatedPost.setHasAccess(true);
        
        logger.info("게시글 수정 완료: postId={}, isSecret={}", id, willBeSecret);
        return updatedPost;
    }

    // 게시글 삭제
    public void delete(Long id, Long authorId) {
        // JOIN FETCH로 author 정보를 미리 로드
        Post post = postRepository.findByIdWithAuthor(id)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다"));

        if (!post.getAuthor().getId().equals(authorId)) {
            logger.warn("권한 없는 게시글 삭제 시도: postId={}, authorId={}, actualAuthorId={}", 
                       id, authorId, post.getAuthor().getId());
            throw new SecurityException("작성자만 삭제할 수 있습니다");
        }

        logger.info("게시글 삭제: postId={}, title={}, authorId={}", 
                   id, post.getTitle(), authorId);
        postRepository.delete(post);
    }
}