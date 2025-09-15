package com.example.blog.dto;

public class PostResponse {
    private Long id;
    private String title;
    private String content;
    private Long authorId;
    private String authorUsername;
    private Boolean isSecret;
    private Boolean hasAccess = false; // 비밀글 접근 권한 여부

    public PostResponse() {}
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    
    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }
    
    public Boolean getIsSecret() { return isSecret; }
    public void setIsSecret(Boolean isSecret) { this.isSecret = isSecret; }
    
    public Boolean getHasAccess() { return hasAccess; }
    public void setHasAccess(Boolean hasAccess) { this.hasAccess = hasAccess; }
}