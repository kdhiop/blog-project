package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CommentRequest {
	@NotBlank(message = "댓글 내용은 필수입니다")
	@Size(min = 1, max = 1000, message = "댓글은 1-1000자 사이여야 합니다")
	private String content;

	public CommentRequest() {
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}
}