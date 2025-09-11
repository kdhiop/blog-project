package com.example.blog.security;

import com.example.blog.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

	private final User user;

	public CustomUserDetails(User user) {
		this.user = user;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// User 엔티티의 role을 기반으로 권한 설정
		String roleName = "ROLE_" + (user.getRole() != null ? user.getRole().name() : "USER");
		return List.of(new SimpleGrantedAuthority(roleName));
	}

	@Override
	public String getPassword() {
		return user.getPassword();
	}

	@Override
	public String getUsername() {
		return user.getUsername();
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return user.getEnabled() != null ? user.getEnabled() : true;
	}

	// 편의 메소드들
	public Long getId() {
		return user.getId();
	}

	public User getUser() {
		return user;
	}

	public User.Role getRole() {
		return user.getRole();
	}

	public boolean hasRole(User.Role role) {
		return user.getRole() == role;
	}

	public boolean isAdmin() {
		return hasRole(User.Role.ADMIN);
	}
}