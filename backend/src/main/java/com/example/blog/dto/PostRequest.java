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
}