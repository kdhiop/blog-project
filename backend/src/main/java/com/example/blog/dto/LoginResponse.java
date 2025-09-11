package com.example.blog.dto;

public class LoginResponse {
	private String token;
	private AuthResponse user;

	public LoginResponse() {
	}

	public LoginResponse(String token, AuthResponse user) {
		this.token = token;
		this.user = user;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public AuthResponse getUser() {
		return user;
	}

	public void setUser(AuthResponse user) {
		this.user = user;
	}
}