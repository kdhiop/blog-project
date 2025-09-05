package com.example.blog.service;

import com.example.blog.model.User;
import com.example.blog.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(String username, String rawPassword) {
        if (userRepository.findByUsername(username) != null) {
            throw new IllegalArgumentException("username exists");
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        return userRepository.save(u);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    public boolean authenticate(String username, String rawPassword) {
        User u = userRepository.findByUsername(username);
        if (u == null) return false;
        return passwordEncoder.matches(rawPassword, u.getPassword());
    }
}
