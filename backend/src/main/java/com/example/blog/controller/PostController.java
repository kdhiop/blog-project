package com.example.blog.controller;

import com.example.blog.dto.PostRequest;
import com.example.blog.dto.PostResponse;
import com.example.blog.model.Post;
import com.example.blog.security.CustomUserDetails;
import com.example.blog.service.PostService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/posts")
@CrossOrigin(origins = "http://localhost:5173")
public class PostController {

	private final PostService postService;

	public PostController(PostService postService) {
		this.postService = postService;
	}

	@GetMapping
	public List<PostResponse> list() {
		return postService.listAll().stream().map(this::toResp).collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public ResponseEntity<PostResponse> get(@PathVariable Long id) {
		try {
			Post post = postService.get(id);
			return ResponseEntity.ok(toResp(post));
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@PostMapping
	public ResponseEntity<PostResponse> create(@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestBody PostRequest req) {
		try {
			if (userDetails == null) {
				return ResponseEntity.status(401).build();
			}

			Post post = postService.create(userDetails.getId(), req.getTitle(), req.getContent());
			return ResponseEntity.ok(toResp(post));
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<PostResponse> update(@PathVariable Long id,
			@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody PostRequest req) {
		try {
			if (userDetails == null) {
				return ResponseEntity.status(401).build();
			}

			Post post = postService.update(id, userDetails.getId(), req.getTitle(), req.getContent());
			return ResponseEntity.ok(toResp(post));
		} catch (SecurityException e) {
			return ResponseEntity.status(403).build(); // Forbidden
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
		}
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
		try {
			if (userDetails == null) {
				return ResponseEntity.status(401).build();
			}

			postService.delete(id, userDetails.getId());
			return ResponseEntity.noContent().build();
		} catch (SecurityException e) {
			return ResponseEntity.status(403).build(); // Forbidden
		} catch (RuntimeException e) {
			return ResponseEntity.notFound().build();
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