package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PostRequest {
	@NotBlank(message = "제목은 필수입니다")
	@Size(min = 1, max = 100, message = "제목은 1-100자 사이여야 합니다")
	private String title;

	@NotBlank(message = "내용은 필수입니다")
	@Size(min = 1, max = 2000, message = "내용은 1-2000자 사이여야 합니다")
	private String content;

	// 비밀글 관련 필드 추가
	private Boolean isSecret = false;

	@Size(max = 50, message = "비밀번호는 50자를 초과할 수 없습니다")
	private String secretPassword;

	public PostRequest() {
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public Boolean getIsSecret() {
		return isSecret;
	}

	public void setIsSecret(Boolean isSecret) {
		this.isSecret = isSecret;
	}

	public String getSecretPassword() {
		return secretPassword;
	}

	public void setSecretPassword(String secretPassword) {
		this.secretPassword = secretPassword;
	}
}