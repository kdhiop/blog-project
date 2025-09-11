package com.example.blog.controller;

import com.example.blog.dto.PostRequest;
import com.example.blog.dto.PostResponse;
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
	public List<PostResponse> list() {
		logger.debug("게시글 목록 조회 요청");
		return postService.listAll().stream().map(this::toResp).collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public ResponseEntity<PostResponse> get(@PathVariable Long id) {
		try {
			logger.debug("게시글 상세 조회: postId={}", id);
			Post post = postService.get(id);
			return ResponseEntity.ok(toResp(post));
		} catch (RuntimeException e) {
			logger.warn("게시글 조회 실패: postId={}, error={}", id, e.getMessage());
			throw e;
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

			logger.info("게시글 작성: userId={}, title={}", userDetails.getId(), req.getTitle());
			Post post = postService.create(userDetails.getId(), req.getTitle(), req.getContent());
			return ResponseEntity.ok(toResp(post));
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

			logger.info("게시글 수정: postId={}, userId={}", id, userDetails.getId());
			Post post = postService.update(id, userDetails.getId(), req.getTitle(), req.getContent());
			return ResponseEntity.ok(toResp(post));
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

	private PostResponse toResp(Post p) {
		PostResponse r = new PostResponse();
		r.setId(p.getId());
		r.setTitle(p.getTitle());
		r.setContent(p.getContent());
		if (p.getAuthor() != null) {
			r.setAuthorId(p.getAuthor().getId());
			r.setAuthorUsername(p.getAuthor().getUsername());
		}
		return r;
	}
}