package com.example.blog.controller;

import com.example.blog.dto.PostRequest;
import com.example.blog.dto.PostResponse;
import com.example.blog.dto.SecretPasswordRequest;
import com.example.blog.model.Post;
import com.example.blog.security.CustomUserDetails;
import com.example.blog.service.PostService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/posts")
public class PostController {

	private static final Logger logger = LoggerFactory.getLogger(PostController.class);
	private final PostService postService;

	public PostController(PostService postService) {
		this.postService = postService;
	}

	@GetMapping
	public List<PostResponse> list(@RequestParam(value = "search", required = false) String searchQuery,
								   @AuthenticationPrincipal CustomUserDetails userDetails) {
		Long currentUserId = userDetails != null ? userDetails.getId() : null;
		
		if (searchQuery != null && !searchQuery.trim().isEmpty()) {
			logger.debug("게시글 검색 요청: query='{}', userId={}", searchQuery, currentUserId);
			// 검색에서는 공개글만 조회
			return postService.searchPublicPosts(searchQuery.trim()).stream()
				.map(post -> toResp(post, currentUserId, false)) // 검색에서는 마스킹 안함
				.collect(Collectors.toList());
		} else {
			logger.debug("전체 게시글 목록 조회 요청 (비밀글 포함), userId={}", currentUserId);
			return postService.listAll().stream()
				.map(post -> toResp(post, currentUserId, true)) // 목록에서는 마스킹 적용
				.collect(Collectors.toList());
		}
	}

	// 별도의 검색 전용 엔드포인트 - 공개글만 검색
	@GetMapping("/search")
	public List<PostResponse> search(@RequestParam("q") String query,
									 @AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			Long currentUserId = userDetails != null ? userDetails.getId() : null;
			logger.info("게시글 검색: query='{}', userId={} (공개글만)", query, currentUserId);
			
			if (query == null || query.trim().isEmpty()) {
				logger.warn("빈 검색어로 검색 시도");
				throw new IllegalArgumentException("검색어는 필수입니다");
			}
			
			String trimmedQuery = query.trim();
			if (trimmedQuery.length() < 2) {
				logger.warn("너무 짧은 검색어: '{}'", trimmedQuery);
				throw new IllegalArgumentException("검색어는 2자 이상이어야 합니다");
			}
			
			// 공개글만 검색
			List<Post> searchResults = postService.searchPublicPosts(trimmedQuery);
			logger.info("검색 완료: query='{}', results={} (공개글만)", trimmedQuery, searchResults.size());
			
			return searchResults.stream()
				.map(post -> toResp(post, currentUserId, false)) // 검색 결과는 마스킹 안함
				.collect(Collectors.toList());
				
		} catch (IllegalArgumentException e) {
			logger.warn("검색 요청 오류: {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			logger.error("검색 중 오류 발생: query='{}'", query, e);
			throw new RuntimeException("검색 중 오류가 발생했습니다");
		}
	}

	@GetMapping("/{id}")
	public ResponseEntity<PostResponse> get(@PathVariable Long id, 
											@AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			Long currentUserId = userDetails != null ? userDetails.getId() : null;
			logger.debug("게시글 상세 조회: postId={}, userId={}", id, currentUserId);
			Post post = postService.get(id);
			
			PostResponse response = toResp(post, currentUserId, false); // 상세 페이지에서는 마스킹 안함
			
			// 비밀글 처리 - 중요: 백엔드에서 접근 권한을 확실히 설정
			if (Boolean.TRUE.equals(post.getIsSecret())) {
				// 작성자인지 확인
				boolean isAuthor = currentUserId != null && 
					post.getAuthor() != null && 
					post.getAuthor().getId().equals(currentUserId);
				
				if (isAuthor) {
					// 작성자는 항상 접근 가능하며 실제 내용을 볼 수 있음
					response.setHasAccess(true);
					response.setContent(post.getContent()); // 실제 내용 설정
					logger.debug("작성자의 비밀글 접근: postId={}, authorId={}", id, currentUserId);
				} else {
					// 작성자가 아니면 내용 숨김 - 비밀번호 입력 필요
					response.setContent("[비밀글입니다. 비밀번호를 입력해주세요.]");
					response.setHasAccess(false);
					logger.debug("비밀글 접근 제한: postId={}, userId={}", id, currentUserId);
				}
			} else {
				// 공개글은 모든 내용 표시
				response.setHasAccess(true);
				response.setContent(post.getContent());
			}
			
			return ResponseEntity.ok(response);
		} catch (RuntimeException e) {
			logger.warn("게시글 조회 실패: postId={}, error={}", id, e.getMessage());
			throw e;
		}
	}

	// 비밀글 비밀번호 확인 엔드포인트
	@PostMapping("/{id}/verify-password")
	public ResponseEntity<PostResponse> verifySecretPassword(
			@PathVariable Long id,
			@Valid @RequestBody SecretPasswordRequest request,
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			Long currentUserId = userDetails != null ? userDetails.getId() : null;
			logger.info("비밀글 비밀번호 확인: postId={}, userId={}", id, currentUserId);
			
			boolean isValid = postService.verifySecretPassword(id, request.getPassword());
			
			if (isValid) {
				Post post = postService.get(id);
				PostResponse response = toResp(post, currentUserId, false); // 상세 보기용
				// 비밀번호 확인 성공 - 접근 권한 부여하고 실제 내용 제공
				response.setHasAccess(true);
				response.setContent(post.getContent()); // 실제 내용 설정
				
				logger.info("비밀글 접근 성공: postId={}", id);
				return ResponseEntity.ok(response);
			} else {
				logger.warn("비밀글 비밀번호 불일치: postId={}", id);
				throw new SecurityException("비밀번호가 일치하지 않습니다");
			}
		} catch (SecurityException e) {
			throw e;
		} catch (Exception e) {
			logger.error("비밀글 비밀번호 확인 중 오류: postId={}", id, e);
			throw new RuntimeException("비밀번호 확인 중 오류가 발생했습니다");
		}
	}

	@PostMapping
	public ResponseEntity<PostResponse> create(
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@Valid @RequestBody PostRequest req) {
		try {
			if (userDetails == null) {
				logger.warn("인증되지 않은 사용자의 게시글 작성 시도");
				throw new SecurityException("로그인이 필요합니다");
			}

			logger.info("게시글 작성: userId={}, title={}, isSecret={}", 
					   userDetails.getId(), req.getTitle(), req.getIsSecret());
			
			Post post = postService.create(userDetails.getId(), req.getTitle(), req.getContent(), 
										   req.getIsSecret(), req.getSecretPassword());
			
			// 작성자는 자신의 글에 항상 접근 가능
			PostResponse response = toResp(post, userDetails.getId(), false);
			response.setHasAccess(true);
			response.setContent(post.getContent());
			
			return ResponseEntity.ok(response);
		} catch (SecurityException e) {
			throw e;
		} catch (Exception e) {
			logger.error("게시글 작성 중 오류: {}", e.getMessage(), e);
			throw new RuntimeException("게시글 작성 중 오류가 발생했습니다");
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<PostResponse> update(
			@PathVariable Long id,
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@Valid @RequestBody PostRequest req) {
		try {
			if (userDetails == null) {
				logger.warn("인증되지 않은 사용자의 게시글 수정 시도: postId={}", id);
				throw new SecurityException("로그인이 필요합니다");
			}

			logger.info("게시글 수정: postId={}, userId={}, isSecret={}", 
					   id, userDetails.getId(), req.getIsSecret());
			
			Post post = postService.update(id, userDetails.getId(), req.getTitle(), req.getContent(),
										   req.getIsSecret(), req.getSecretPassword());
			
			// 작성자는 자신의 글에 항상 접근 가능
			PostResponse response = toResp(post, userDetails.getId(), false);
			response.setHasAccess(true);
			response.setContent(post.getContent());
			
			return ResponseEntity.ok(response);
		} catch (SecurityException e) {
			logger.warn("게시글 수정 권한 없음: postId={}, userId={}", id, userDetails != null ? userDetails.getId() : null);
			throw e;
		} catch (RuntimeException e) {
			logger.warn("게시글 수정 실패: postId={}, error={}", id, e.getMessage());
			throw e;
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(
			@PathVariable Long id, 
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			if (userDetails == null) {
				logger.warn("인증되지 않은 사용자의 게시글 삭제 시도: postId={}", id);
				throw new SecurityException("로그인이 필요합니다");
			}

			logger.info("게시글 삭제: postId={}, userId={}", id, userDetails.getId());
			postService.delete(id, userDetails.getId());
			return ResponseEntity.noContent().build();
		} catch (SecurityException e) {
			logger.warn("게시글 삭제 권한 없음: postId={}, userId={}", id, userDetails != null ? userDetails.getId() : null);
			throw e;
		} catch (RuntimeException e) {
			logger.warn("게시글 삭제 실패: postId={}, error={}", id, e.getMessage());
			throw e;
		}
	}

	// PostResponse 변환 메서드 (현재 사용자 ID 고려, 마스킹 옵션 추가)
	private PostResponse toResp(Post p, Long currentUserId, boolean maskSecretPosts) {
		PostResponse r = new PostResponse();
		r.setId(p.getId());
		r.setIsSecret(p.getIsSecret());
		
		// 작성자 정보 설정
		if (p.getAuthor() != null) {
			r.setAuthorId(p.getAuthor().getId());
			r.setAuthorUsername(p.getAuthor().getUsername());
		}
		
		// 비밀글 처리 로직
		if (Boolean.TRUE.equals(p.getIsSecret())) {
			// 작성자인지 확인
			boolean isAuthor = currentUserId != null && 
				p.getAuthor() != null && 
				p.getAuthor().getId().equals(currentUserId);
			
			if (isAuthor) {
				// 작성자는 실제 제목과 내용을 볼 수 있음
				r.setTitle(p.getTitle());
				r.setContent(p.getContent());
				r.setHasAccess(true);
			} else if (maskSecretPosts) {
				// 목록에서는 제목과 내용을 모두 숨김
				r.setTitle("🔐 비밀글");
				r.setContent("[비밀글입니다. 클릭하여 비밀번호를 입력해주세요.]");
				r.setHasAccess(false);
			} else {
				// 상세 보기나 검색에서는 제목은 보이되 내용만 숨김
				r.setTitle(p.getTitle());
				r.setContent("[비밀글입니다. 비밀번호를 입력해주세요.]");
				r.setHasAccess(false);
			}
		} else {
			// 공개글은 모든 내용 표시
			r.setTitle(p.getTitle());
			r.setContent(p.getContent());
			r.setHasAccess(true);
		}
		
		return r;
	}
}