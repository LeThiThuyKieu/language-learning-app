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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocialAuthService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final List<SocialProviderClient> socialProviderClients;

    @Transactional
    public AuthResponse login(String providerName, String accessToken, String oauthCode, String redirectUri) {
        String normalizedProvider = normalizeProvider(providerName);
        SocialProviderClient providerClient = findProviderClient(normalizedProvider);
        String resolvedAccessToken = resolveAccessToken(providerClient, accessToken, oauthCode, redirectUri);
        SocialUserInfo userInfo = providerClient.getUserInfo(resolvedAccessToken);

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

    private String resolveAccessToken(
            SocialProviderClient providerClient,
            String accessToken,
            String oauthCode,
            String redirectUri
    ) {
        if (accessToken != null && !accessToken.isBlank()) {
            return accessToken.trim();
        }
        if (oauthCode == null || oauthCode.isBlank()) {
            throw new BadCredentialsException("Access token is required");
        }
        if (!providerClient.supportsOAuthAuthorizationCode()) {
            throw new BadCredentialsException("Authorization code is not supported for this provider");
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new BadCredentialsException("redirectUri is required for authorization code login");
        }
        return providerClient.exchangeOAuthCode(oauthCode.trim(), redirectUri.trim());
    }

    private String normalizeProvider(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            throw new BadCredentialsException("Provider is required");
        }
        return providerName.trim().toLowerCase(Locale.ROOT);
    }

    private SocialProviderClient findProviderClient(String providerName) {
        Map<String, SocialProviderClient> providers = socialProviderClients
                .stream()
                .collect(Collectors.toMap(SocialProviderClient::provider, Function.identity()));

        SocialProviderClient providerClient = providers.get(providerName);
        if (providerClient == null) {
            throw new BadCredentialsException("Unsupported social provider: " + providerName);
        }

        return providerClient;
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
