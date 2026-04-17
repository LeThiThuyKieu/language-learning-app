package com.languagelearning.service.social;

import com.languagelearning.dto.AuthResponse;
import com.languagelearning.dto.UserDTO;
import com.languagelearning.entity.Role;
import com.languagelearning.entity.User;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.exception.BadCredentialsException;
import com.languagelearning.repository.mysql.RoleRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import com.languagelearning.util.AvatarDefaults;
import com.languagelearning.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialAuthService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse loginWithOAuth2(String providerName, SocialUserInfo userInfo) {
        String normalizedProvider = normalizeProvider(providerName);
        return loginWithProviderInfo(normalizedProvider, userInfo);
    }

    private AuthResponse loginWithProviderInfo(String normalizedProvider, SocialUserInfo userInfo) {
        User.AuthProvider provider = toAuthProvider(normalizedProvider);
        User user = userRepository
                .findByAuthProviderAndProviderUserId(provider, userInfo.providerUserId())
                .orElseGet(() -> createOrLinkUser(provider, userInfo));

        if (user.getStatus() == User.UserStatus.banned) {
            throw new BadCredentialsException("Account is banned");
        }

        user.setLastLogin(LocalDateTime.now());
        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return new AuthResponse(UserDTO.fromUser(user), token, refreshToken);
    }

    private String normalizeProvider(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            throw new IllegalArgumentException("Provider is required");
        }
        return providerName.trim().toLowerCase(Locale.ROOT);
    }

    private User createOrLinkUser(User.AuthProvider provider, SocialUserInfo userInfo) {
        return userRepository.findByEmail(userInfo.email())
                .map(existingUser -> linkExistingUser(existingUser, provider, userInfo.providerUserId()))
                .orElseGet(() -> createSocialUser(provider, userInfo));
    }

    private User linkExistingUser(User existingUser, User.AuthProvider provider, String providerUserId) {
        // Nếu email đã tồn tại (dù là LOCAL, GOOGLE hay FACEBOOK) → đăng nhập vào tài khoản đó luôn
        // Cập nhật providerUserId nếu chưa có
        if (existingUser.getAuthProvider() == provider
                && (existingUser.getProviderUserId() == null || existingUser.getProviderUserId().isBlank())) {
            existingUser.setProviderUserId(providerUserId);
        }
        return userRepository.save(existingUser);
    }

    private User createSocialUser(User.AuthProvider provider, SocialUserInfo userInfo) {
        User user = new User();
        user.setEmail(userInfo.email());
        user.setPasswordHash(null);
        user.setAuthProvider(provider);
        user.setProviderUserId(userInfo.providerUserId());
        user.setStatus(User.UserStatus.active);

        Role userRole = roleRepository.findByRoleName("USER")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRoleName("USER");
                    return roleRepository.save(newRole);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        user = userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFullName(userInfo.fullName());
        profile.setAvatarUrl(AvatarDefaults.randomAvatarUrl());
        profile.setTotalXp(0);
        profile.setStreakCount(0);
        userProfileRepository.save(profile);

        return user;
    }

    private User.AuthProvider toAuthProvider(String providerName) {
        return switch (providerName) {
            case "google" -> User.AuthProvider.GOOGLE;
            case "facebook" -> User.AuthProvider.FACEBOOK;
            default -> throw new BadCredentialsException("Unsupported social provider: " + providerName);
        };
    }
}
