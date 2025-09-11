package com.example.blog.controller;

import com.example.blog.dto.CommentRequest;
import com.example.blog.dto.CommentResponse;
import com.example.blog.model.Comment;
import com.example.blog.security.CustomUserDetails;
import com.example.blog.service.CommentService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/posts/{postId}/comments")
public class CommentController {

	private static final Logger logger = LoggerFactory.getLogger(CommentController.class);
	private final CommentService commentService;

	public CommentController(CommentService commentService) {
		this.commentService = commentService;
	}

	@GetMapping
	public List<CommentResponse> list(@PathVariable Long postId) {
		logger.debug("댓글 목록 조회: postId={}", postId);
		return commentService.listByPost(postId).stream().map(this::toResp).collect(Collectors.toList());
	}

	@PostMapping
	public ResponseEntity<CommentResponse> add(
			@PathVariable Long postId,
			@AuthenticationPrincipal CustomUserDetails userDetails, 
			@Valid @RequestBody CommentRequest req) {
		try {
			if (userDetails == null) {
				logger.warn("인증되지 않은 사용자의 댓글 작성 시도: postId={}", postId);
				throw new SecurityException("로그인이 필요합니다");
			}

			logger.info("댓글 작성: postId={}, userId={}", postId, userDetails.getId());
			Comment comment = commentService.add(postId, userDetails.getId(), req.getContent());
			return ResponseEntity.ok(toResp(comment));
		} catch (SecurityException e) {
			throw e;
		} catch (RuntimeException e) {
			logger.error("댓글 작성 중 오류: postId={}, error={}", postId, e.getMessage());
			throw new RuntimeException("댓글 작성 중 오류가 발생했습니다");
		}
	}

	@PutMapping("/{commentId}")
	public ResponseEntity<CommentResponse> update(
			@PathVariable Long postId, 
			@PathVariable Long commentId,
			@AuthenticationPrincipal CustomUserDetails userDetails, 
			@Valid @RequestBody CommentRequest req) {
		try {
			if (userDetails == null) {
				logger.warn("인증되지 않은 사용자의 댓글 수정 시도: commentId={}", commentId);
				throw new SecurityException("로그인이 필요합니다");
			}

			logger.info("댓글 수정: commentId={}, userId={}", commentId, userDetails.getId());
			Comment comment = commentService.update(commentId, userDetails.getId(), req.getContent());
			return ResponseEntity.ok(toResp(comment));
		} catch (SecurityException e) {
			logger.warn("댓글 수정 권한 없음: commentId={}, userId={}", commentId, userDetails != null ? userDetails.getId() : null);
			throw e;
		} catch (RuntimeException e) {
			logger.warn("댓글 수정 실패: commentId={}, error={}", commentId, e.getMessage());
			throw e;
		}
	}

	@DeleteMapping("/{commentId}")
	public ResponseEntity<Void> delete(
			@PathVariable Long postId, 
			@PathVariable Long commentId,
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			if (userDetails == null) {
				logger.warn("인증되지 않은 사용자의 댓글 삭제 시도: commentId={}", commentId);
				throw new SecurityException("로그인이 필요합니다");
			}

			logger.info("댓글 삭제: commentId={}, userId={}", commentId, userDetails.getId());
			commentService.delete(commentId, userDetails.getId());
			return ResponseEntity.noContent().build();
		} catch (SecurityException e) {
			logger.warn("댓글 삭제 권한 없음: commentId={}, userId={}", commentId, userDetails != null ? userDetails.getId() : null);
			throw e;
		} catch (RuntimeException e) {
			logger.warn("댓글 삭제 실패: commentId={}, error={}", commentId, e.getMessage());
			throw e;
		}
	}

	private CommentResponse toResp(Comment c) {
		CommentResponse r = new CommentResponse();
		r.setId(c.getId());
		r.setContent(c.getContent());
		if (c.getAuthor() != null) {
			r.setAuthorId(c.getAuthor().getId());
			r.setAuthorUsername(c.getAuthor().getUsername());
		}
		return r;
	}
}