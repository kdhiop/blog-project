package com.example.blog.controller;

import com.example.blog.dto.AuthRequest;
import com.example.blog.dto.AuthResponse;
import com.example.blog.dto.LoginResponse;
import com.example.blog.model.User;
import com.example.blog.security.JwtTokenProvider;
import com.example.blog.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

	private final UserService userService;
	private final JwtTokenProvider jwtTokenProvider;

	public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider) {
		this.userService = userService;
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest req) {
		try {
			logger.info("회원가입 시도: {}", req.getUsername());

			User user = userService.register(req.getUsername(), req.getPassword());

			logger.info("회원가입 성공: {}", user.getUsername());
			return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername()));

		} catch (IllegalArgumentException ex) {
			logger.warn("회원가입 실패 - {}: {}", req.getUsername(), ex.getMessage());
			return ResponseEntity.badRequest().build();
		} catch (Exception ex) {
			logger.error("회원가입 중 예외 발생: {}", ex.getMessage(), ex);
			return ResponseEntity.status(500).build();
		}
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody AuthRequest req) {
		try {
			logger.info("로그인 시도: {}", req.getUsername());

			boolean isValid = userService.authenticate(req.getUsername(), req.getPassword());
			if (isValid) {
				User user = userService.findByUsername(req.getUsername());
				String token = jwtTokenProvider.createToken(user.getUsername(), user.getId());

				LoginResponse response = new LoginResponse();
				response.setToken(token);
				response.setUser(new AuthResponse(user.getId(), user.getUsername()));

				logger.info("로그인 성공: {}", user.getUsername());
				return ResponseEntity.ok(response);
			} else {
				logger.warn("로그인 실패 - 잘못된 인증 정보: {}", req.getUsername());
				return ResponseEntity.status(401).build();
			}
		} catch (Exception e) {
			logger.error("로그인 중 예외 발생: {}", e.getMessage(), e);
			return ResponseEntity.status(500).build();
		}
	}

	@GetMapping("/me")
	public ResponseEntity<AuthResponse> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
		try {
			String token = jwtTokenProvider.resolveToken(authHeader);
			if (token != null && jwtTokenProvider.validateToken(token)) {
				String username = jwtTokenProvider.getUsername(token);
				Long userId = jwtTokenProvider.getUserId(token);

				logger.debug("현재 사용자 정보 조회: {}", username);
				return ResponseEntity.ok(new AuthResponse(userId, username));
			} else {
				logger.warn("유효하지 않은 토큰으로 사용자 정보 조회 시도");
				return ResponseEntity.status(401).build();
			}
		} catch (Exception e) {
			logger.error("사용자 정보 조회 중 예외 발생: {}", e.getMessage(), e);
			return ResponseEntity.status(401).build();
		}
	}

	// 호환성을 위해 유지 (프론트엔드가 아직 사용 중)
	@GetMapping("/user")
	public ResponseEntity<AuthResponse> findUser(@RequestParam String username) {
		try {
			User user = userService.findByUsername(username);
			if (user == null) {
				logger.warn("존재하지 않는 사용자 조회: {}", username);
				return ResponseEntity.notFound().build();
			}

			return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername()));
		} catch (Exception e) {
			logger.error("사용자 조회 중 예외 발생: {}", e.getMessage(), e);
			return ResponseEntity.status(500).build();
		}
	}
}