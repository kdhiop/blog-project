package com.example.blog.controller;

import com.example.blog.dto.AuthRequest;
import com.example.blog.dto.AuthResponse;
import com.example.blog.dto.LoginResponse;
import com.example.blog.model.User;
import com.example.blog.security.JwtTokenProvider;
import com.example.blog.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

	private final UserService userService;
	private final JwtTokenProvider jwtTokenProvider;

	public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider) {
		this.userService = userService;
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest req) {
		try {
			User user = userService.register(req.getUsername(), req.getPassword());
			// 보안: 비밀번호는 절대 응답에 포함하지 않음
			return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername()));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@RequestBody AuthRequest req) {
		try {
			boolean isValid = userService.authenticate(req.getUsername(), req.getPassword());
			if (isValid) {
				User user = userService.findByUsername(req.getUsername());
				String token = jwtTokenProvider.createToken(user.getUsername(), user.getId());

				LoginResponse response = new LoginResponse();
				response.setToken(token);
				response.setUser(new AuthResponse(user.getId(), user.getUsername()));

				return ResponseEntity.ok(response);
			}
			return ResponseEntity.status(401).build();
		} catch (Exception e) {
			return ResponseEntity.status(500).build();
		}
	}

	// 토큰 검증 및 사용자 정보 반환 (옵션)
	@GetMapping("/me")
	public ResponseEntity<AuthResponse> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
		try {
			String token = jwtTokenProvider.resolveToken(authHeader);
			if (token != null && jwtTokenProvider.validateToken(token)) {
				String username = jwtTokenProvider.getUsername(token);
				Long userId = jwtTokenProvider.getUserId(token);
				return ResponseEntity.ok(new AuthResponse(userId, username));
			}
			return ResponseEntity.status(401).build();
		} catch (Exception e) {
			return ResponseEntity.status(401).build();
		}
	}

	// 호환성을 위해 유지 (프론트엔드가 아직 사용 중)
	@GetMapping("/user")
	public ResponseEntity<AuthResponse> findUser(@RequestParam String username) {
		User u = userService.findByUsername(username);
		if (u == null)
			return ResponseEntity.notFound().build();
		return ResponseEntity.ok(new AuthResponse(u.getId(), u.getUsername()));
	}
}