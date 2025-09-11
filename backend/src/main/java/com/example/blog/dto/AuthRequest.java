package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthRequest {
	@NotBlank(message = "사용자명은 필수입니다")
	@Size(min = 3, max = 20, message = "사용자명은 3-20자 사이여야 합니다")
	private String username;

	@NotBlank(message = "비밀번호는 필수입니다")
	@Size(min = 6, max = 100, message = "비밀번호는 6자 이상이어야 합니다")
	private String password;

	public AuthRequest() {
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}