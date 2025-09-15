package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SecretPasswordRequest {
    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(max = 50, message = "비밀번호는 50자를 초과할 수 없습니다")
    private String password;

    public SecretPasswordRequest() {}

    public SecretPasswordRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}