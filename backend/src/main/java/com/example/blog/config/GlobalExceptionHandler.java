package com.example.blog.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
		ErrorResponse error = new ErrorResponse("BAD_REQUEST", ex.getMessage(), LocalDateTime.now());
		return ResponseEntity.badRequest().body(error);
	}

	@ExceptionHandler(SecurityException.class)
	public ResponseEntity<ErrorResponse> handleSecurityException(SecurityException ex) {
		ErrorResponse error = new ErrorResponse("FORBIDDEN", "권한이 없습니다: " + ex.getMessage(), LocalDateTime.now());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
		ErrorResponse error = new ErrorResponse("FORBIDDEN", "접근이 거부되었습니다", LocalDateTime.now());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
		ErrorResponse error = new ErrorResponse("UNAUTHORIZED", "잘못된 인증 정보입니다", LocalDateTime.now());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
	}

	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
		ErrorResponse error = new ErrorResponse("NOT_FOUND", "요청한 리소스를 찾을 수 없습니다", LocalDateTime.now());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ValidationErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new HashMap<>();

		ex.getBindingResult().getAllErrors().forEach((error) -> {
			String fieldName = ((FieldError) error).getField();
			String errorMessage = error.getDefaultMessage();
			errors.put(fieldName, errorMessage);
		});

		ValidationErrorResponse errorResponse = new ValidationErrorResponse("VALIDATION_FAILED", "입력값 검증에 실패했습니다",
				LocalDateTime.now(), errors);

		return ResponseEntity.badRequest().body(errorResponse);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
		ErrorResponse error = new ErrorResponse("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다", LocalDateTime.now());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
	}

	// 기본 에러 응답 클래스
	public static class ErrorResponse {
		private String code;
		private String message;
		private LocalDateTime timestamp;

		public ErrorResponse(String code, String message, LocalDateTime timestamp) {
			this.code = code;
			this.message = message;
			this.timestamp = timestamp;
		}

		// Getters
		public String getCode() {
			return code;
		}

		public String getMessage() {
			return message;
		}

		public LocalDateTime getTimestamp() {
			return timestamp;
		}
	}

	// 유효성 검증 에러 응답 클래스
	public static class ValidationErrorResponse extends ErrorResponse {
		private Map<String, String> fieldErrors;

		public ValidationErrorResponse(String code, String message, LocalDateTime timestamp,
				Map<String, String> fieldErrors) {
			super(code, message, timestamp);
			this.fieldErrors = fieldErrors;
		}

		public Map<String, String> getFieldErrors() {
			return fieldErrors;
		}
	}
}