package com.example.blog.service;

import com.example.blog.model.User;
import com.example.blog.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(String username, String rawPassword) {
        // 입력값 유효성 검증
        if (username == null || username.trim().isEmpty()) {
            logger.warn("회원가입 실패 - 빈 사용자명");
            throw new IllegalArgumentException("사용자명은 필수입니다");
        }
        
        if (rawPassword == null || rawPassword.isEmpty()) {
            logger.warn("회원가입 실패 - 빈 비밀번호");
            throw new IllegalArgumentException("비밀번호는 필수입니다");
        }

        String trimmedUsername = username.trim();
        
        // 사용자명 길이 검증
        if (trimmedUsername.length() < 3 || trimmedUsername.length() > 20) {
            logger.warn("회원가입 실패 - 잘못된 사용자명 길이: {}", trimmedUsername.length());
            throw new IllegalArgumentException("사용자명은 3-20자 사이여야 합니다");
        }
        
        // 비밀번호 길이 검증
        if (rawPassword.length() < 6) {
            logger.warn("회원가입 실패 - 비밀번호가 너무 짧음: {}", rawPassword.length());
            throw new IllegalArgumentException("비밀번호는 6자 이상이어야 합니다");
        }
        
        // 중복 사용자명 검증
        if (userRepository.findByUsername(trimmedUsername) != null) {
            logger.warn("회원가입 실패 - 이미 존재하는 사용자명: {}", trimmedUsername);
            throw new IllegalArgumentException("이미 사용 중인 사용자명입니다");
        }
        
        try {
            User user = new User();
            user.setUsername(trimmedUsername);
            user.setPassword(passwordEncoder.encode(rawPassword));
            
            User savedUser = userRepository.save(user);
            logger.info("사용자 등록 성공: userId={}, username={}", savedUser.getId(), savedUser.getUsername());
            
            return savedUser;
        } catch (Exception e) {
            logger.error("사용자 등록 중 데이터베이스 오류: {}", e.getMessage(), e);
            throw new RuntimeException("사용자 등록 중 오류가 발생했습니다");
        }
    }

    public User findByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            logger.warn("빈 사용자명으로 사용자 조회 시도");
            return null;
        }
        
        String trimmedUsername = username.trim();
        
        try {
            User user = userRepository.findByUsername(trimmedUsername);
            if (user != null) {
                logger.debug("사용자 조회 성공: userId={}, username={}", user.getId(), user.getUsername());
            } else {
                logger.debug("사용자 조회 결과 없음: {}", trimmedUsername);
            }
            return user;
        } catch (Exception e) {
            logger.error("사용자 조회 중 데이터베이스 오류: {}", e.getMessage(), e);
            throw new RuntimeException("사용자 조회 중 오류가 발생했습니다");
        }
    }

    public User findById(Long id) {
        if (id == null) {
            logger.warn("null ID로 사용자 조회 시도");
            throw new IllegalArgumentException("사용자 ID는 필수입니다");
        }
        
        try {
            return userRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("존재하지 않는 사용자 ID: {}", id);
                    return new RuntimeException("사용자를 찾을 수 없습니다");
                });
        } catch (RuntimeException e) {
            throw e; // 이미 적절한 예외이므로 다시 던짐
        } catch (Exception e) {
            logger.error("사용자 조회 중 데이터베이스 오류: {}", e.getMessage(), e);
            throw new RuntimeException("사용자 조회 중 오류가 발생했습니다");
        }
    }

    public boolean authenticate(String username, String rawPassword) {
        if (username == null || username.trim().isEmpty()) {
            logger.warn("빈 사용자명으로 인증 시도");
            return false;
        }
        
        if (rawPassword == null || rawPassword.isEmpty()) {
            logger.warn("빈 비밀번호로 인증 시도");
            return false;
        }
        
        String trimmedUsername = username.trim();
        
        try {
            User user = userRepository.findByUsername(trimmedUsername);
            if (user == null) {
                logger.debug("존재하지 않는 사용자로 인증 시도: {}", trimmedUsername);
                return false;
            }
            
            boolean matches = passwordEncoder.matches(rawPassword, user.getPassword());
            
            if (matches) {
                logger.debug("사용자 인증 성공: {}", trimmedUsername);
            } else {
                logger.debug("사용자 인증 실패 - 잘못된 비밀번호: {}", trimmedUsername);
            }
            
            return matches;
        } catch (Exception e) {
            logger.error("사용자 인증 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }
}