package com.example.blog.dto;

public class PostRequest {
    private String title;
    private String content;
    public PostRequest() {}
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
