package com.example.blog.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_post_author_id", columnList = "author_id"),
    @Index(name = "idx_post_created_at", columnList = "created_at"),
    @Index(name = "idx_post_is_secret", columnList = "is_secret")
})
public class Post {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 2000, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();

    // 비밀글 관련 필드 추가
    @Column(name = "is_secret", nullable = false)
    private Boolean isSecret = false;

    @Column(name = "secret_password", length = 255)
    private String secretPassword; // 암호화된 비밀번호 저장

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;
    
    @Transient
    private Boolean hasAccess = false;

    // 기본 생성자
    public Post() {}

    // 편의 생성자
    public Post(String title, String content) { 
        this.title = title; 
        this.content = content; 
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }

    public Boolean getIsSecret() { return isSecret; }
    public void setIsSecret(Boolean isSecret) { this.isSecret = isSecret; }

    public String getSecretPassword() { return secretPassword; }
    public void setSecretPassword(String secretPassword) { this.secretPassword = secretPassword; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    
    public Boolean getHasAccess() { 
        return hasAccess; 
    }
    
    public void setHasAccess(Boolean hasAccess) { 
        this.hasAccess = hasAccess; 
    }

    // 편의 메소드
    public boolean isSecret() {
        return Boolean.TRUE.equals(isSecret);
    }

    @Override
    public String toString() {
        return "Post{id=" + id + ", title='" + title + "', author=" + 
               (author != null ? author.getUsername() : "null") + 
               ", isSecret=" + isSecret + "}";
    }
}