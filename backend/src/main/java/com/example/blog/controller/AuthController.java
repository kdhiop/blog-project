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
			// 입력값 정리 (trim 처리)
			String trimmedUsername = req.getUsername() != null ? req.getUsername().trim() : "";
			
			logger.info("회원가입 시도: username={}, passwordLength={}", 
			           trimmedUsername, 
			           req.getPassword() != null ? req.getPassword().length() : 0);

			// 추가 유효성 검증
			if (trimmedUsername.isEmpty()) {
				logger.warn("회원가입 실패 - 빈 사용자명");
				throw new IllegalArgumentException("사용자명은 필수입니다");
			}

			if (req.getPassword() == null || req.getPassword().isEmpty()) {
				logger.warn("회원가입 실패 - 빈 비밀번호");
				throw new IllegalArgumentException("비밀번호는 필수입니다");
			}

			User user = userService.register(trimmedUsername, req.getPassword());

			logger.info("회원가입 성공: userId={}, username={}", user.getId(), user.getUsername());
			return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername()));

		} catch (IllegalArgumentException ex) {
			logger.warn("회원가입 실패 - {}: {}", req.getUsername(), ex.getMessage());
			// GlobalExceptionHandler가 처리하도록 예외를 다시 던짐
			throw ex;
		} catch (Exception ex) {
			logger.error("회원가입 중 예외 발생: {}", ex.getMessage(), ex);
			throw new RuntimeException("회원가입 처리 중 오류가 발생했습니다");
		}
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody AuthRequest req) {
		try {
			// 입력값 정리 (trim 처리)
			String trimmedUsername = req.getUsername() != null ? req.getUsername().trim() : "";
			
			logger.info("로그인 시도: username={}", trimmedUsername);

			// 추가 유효성 검증
			if (trimmedUsername.isEmpty()) {
				logger.warn("로그인 실패 - 빈 사용자명");
				throw new IllegalArgumentException("사용자명은 필수입니다");
			}

			if (req.getPassword() == null || req.getPassword().isEmpty()) {
				logger.warn("로그인 실패 - 빈 비밀번호");
				throw new IllegalArgumentException("비밀번호는 필수입니다");
			}

			boolean isValid = userService.authenticate(trimmedUsername, req.getPassword());
			if (isValid) {
				User user = userService.findByUsername(trimmedUsername);
				String token = jwtTokenProvider.createToken(user.getUsername(), user.getId());

				LoginResponse response = new LoginResponse();
				response.setToken(token);
				response.setUser(new AuthResponse(user.getId(), user.getUsername()));

				logger.info("로그인 성공: userId={}, username={}", user.getId(), user.getUsername());
				return ResponseEntity.ok(response);
			} else {
				logger.warn("로그인 실패 - 잘못된 인증 정보: {}", trimmedUsername);
				throw new SecurityException("잘못된 인증 정보입니다");
			}
		} catch (IllegalArgumentException | SecurityException ex) {
			logger.warn("로그인 실패 - {}: {}", req.getUsername(), ex.getMessage());
			// GlobalExceptionHandler가 처리하도록 예외를 다시 던짐
			throw ex;
		} catch (Exception ex) {
			logger.error("로그인 중 예외 발생: {}", ex.getMessage(), ex);
			throw new RuntimeException("로그인 처리 중 오류가 발생했습니다");
		}
	}

	@GetMapping("/me")
	public ResponseEntity<AuthResponse> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
		try {
			String token = jwtTokenProvider.resolveToken(authHeader);
			if (token != null && jwtTokenProvider.validateToken(token)) {
				String username = jwtTokenProvider.getUsername(token);
				Long userId = jwtTokenProvider.getUserId(token);

				logger.debug("현재 사용자 정보 조회: userId={}, username={}", userId, username);
				return ResponseEntity.ok(new AuthResponse(userId, username));
			} else {
				logger.warn("유효하지 않은 토큰으로 사용자 정보 조회 시도");
				throw new SecurityException("유효하지 않은 토큰입니다");
			}
		} catch (SecurityException ex) {
			logger.warn("사용자 정보 조회 실패: {}", ex.getMessage());
			throw ex;
		} catch (Exception ex) {
			logger.error("사용자 정보 조회 중 예외 발생: {}", ex.getMessage(), ex);
			throw new RuntimeException("사용자 정보 조회 중 오류가 발생했습니다");
		}
	}

	// 호환성을 위해 유지 (프론트엔드가 아직 사용 중인 경우)
	@GetMapping("/user")
	public ResponseEntity<AuthResponse> findUser(@RequestParam String username) {
		try {
			String trimmedUsername = username != null ? username.trim() : "";
			
			if (trimmedUsername.isEmpty()) {
				logger.warn("빈 사용자명으로 사용자 조회 시도");
				throw new IllegalArgumentException("사용자명은 필수입니다");
			}

			User user = userService.findByUsername(trimmedUsername);
			if (user == null) {
				logger.warn("존재하지 않는 사용자 조회: {}", trimmedUsername);
				throw new RuntimeException("사용자를 찾을 수 없습니다");
			}

			return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername()));
		} catch (IllegalArgumentException ex) {
			logger.warn("사용자 조회 실패: {}", ex.getMessage());
			throw ex;
		} catch (RuntimeException ex) {
			logger.warn("사용자 조회 실패: {}", ex.getMessage());
			throw ex;
		} catch (Exception ex) {
			logger.error("사용자 조회 중 예외 발생: {}", ex.getMessage(), ex);
			throw new RuntimeException("사용자 조회 중 오류가 발생했습니다");
		}
	}
}