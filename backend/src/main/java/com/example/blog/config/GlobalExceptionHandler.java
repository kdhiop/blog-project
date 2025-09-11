package com.example.blog.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        logger.warn("잘못된 인자: {} - {}", request.getDescription(false), ex.getMessage());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, WebRequest request) {
        logger.warn("타입 불일치: {} - {}", request.getDescription(false), ex.getMessage());
        String message = String.format("'%s' 파라미터의 값 '%s'이(가) 올바르지 않습니다", ex.getName(), ex.getValue());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", message, LocalDateTime.now());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurityException(SecurityException ex, WebRequest request) {
        logger.warn("보안 예외: {} - {}", request.getDescription(false), ex.getMessage());
        
        // 인증 관련 에러는 401, 권한 관련 에러는 403
        if (ex.getMessage().contains("토큰") || ex.getMessage().contains("인증")) {
            ErrorResponse error = new ErrorResponse("UNAUTHORIZED", ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } else {
            ErrorResponse error = new ErrorResponse("FORBIDDEN", "권한이 없습니다: " + ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        logger.warn("접근 거부: {} - {}", request.getDescription(false), ex.getMessage());
        ErrorResponse error = new ErrorResponse("FORBIDDEN", "접근이 거부되었습니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, WebRequest request) {
        logger.warn("잘못된 인증 정보: {} - {}", request.getDescription(false), ex.getMessage());
        ErrorResponse error = new ErrorResponse("UNAUTHORIZED", "잘못된 인증 정보입니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex, WebRequest request) {
        logger.warn("런타임 예외: {} - {}", request.getDescription(false), ex.getMessage());
        
        // 특정 메시지에 따라 다른 상태 코드 반환
        if (ex.getMessage().contains("찾을 수 없습니다") || ex.getMessage().contains("존재하지 않습니다")) {
            ErrorResponse error = new ErrorResponse("NOT_FOUND", ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } else if (ex.getMessage().contains("이미 존재") || ex.getMessage().contains("중복")) {
            ErrorResponse error = new ErrorResponse("CONFLICT", ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } else {
            ErrorResponse error = new ErrorResponse("BAD_REQUEST", ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        logger.warn("유효성 검증 실패: {} - {}", request.getDescription(false), ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            logger.debug("필드 검증 오류 - {}: {}", fieldName, errorMessage);
        });

        ValidationErrorResponse errorResponse = new ValidationErrorResponse(
            "VALIDATION_FAILED", 
            "입력값 검증에 실패했습니다",
            LocalDateTime.now(), 
            errors
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        logger.error("예상치 못한 예외 발생: {} - {}", request.getDescription(false), ex.getMessage(), ex);
        ErrorResponse error = new ErrorResponse("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    // 기본 에러 응답 클래스 (record 사용으로 최신화)
    public record ErrorResponse(
        String code,
        String message,
        LocalDateTime timestamp
    ) {}

    // 유효성 검증 에러 응답 클래스
    public record ValidationErrorResponse(
        String code,
        String message,
        LocalDateTime timestamp,
        Map<String, String> fieldErrors
    ) {}
}