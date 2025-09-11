package com.example.blog.controller;

import com.example.blog.dto.CommentRequest;
import com.example.blog.dto.CommentResponse;
import com.example.blog.model.Comment;
import com.example.blog.security.CustomUserDetails;
import com.example.blog.service.CommentService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/posts/{postId}/comments")
@CrossOrigin(origins = "http://localhost:5173")
public class CommentController {

	private final CommentService commentService;

	public CommentController(CommentService commentService) {
		this.commentService = commentService;
	}

	@GetMapping
	public List<CommentResponse> list(@PathVariable Long postId) {
		return commentService.listByPost(postId).stream().map(this::toResp).collect(Collectors.toList());
	}

	@PostMapping
	public ResponseEntity<CommentResponse> add(@PathVariable Long postId,
			@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody CommentRequest req) {
		try {
			if (userDetails == null) {
				return ResponseEntity.status(401).build();
			}

			Comment comment = commentService.add(postId, userDetails.getId(), req.getContent());
			return ResponseEntity.ok(toResp(comment));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PutMapping("/{commentId}")
	public ResponseEntity<CommentResponse> update(@PathVariable Long postId, @PathVariable Long commentId,
			@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody CommentRequest req) {
		try {
			if (userDetails == null) {
				return ResponseEntity.status(401).build();
			}

			Comment comment = commentService.update(commentId, userDetails.getId(), req.getContent());
			return ResponseEntity.ok(toResp(comment));
		} catch (SecurityException e) {
			return ResponseEntity.status(403).build(); // Forbidden
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@DeleteMapping("/{commentId}")
	public ResponseEntity<Void> delete(@PathVariable Long postId, @PathVariable Long commentId,
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			if (userDetails == null) {
				return ResponseEntity.status(401).build();
			}

			commentService.delete(commentId, userDetails.getId());
			return ResponseEntity.noContent().build();
		} catch (SecurityException e) {
			return ResponseEntity.status(403).build(); // Forbidden
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
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