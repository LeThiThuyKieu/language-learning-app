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
import com.languagelearning.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
    public AuthResponse login(String providerName, String accessToken) {
        String normalizedProvider = normalizeProvider(providerName);
        SocialProviderClient providerClient = findProviderClient(normalizedProvider);
        SocialUserInfo userInfo = providerClient.getUserInfo(accessToken);

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
        if (existingUser.getAuthProvider() == User.AuthProvider.local) {
            throw new BadCredentialsException("Email already registered with password. Please login with email/password first.");
        }

        if (existingUser.getAuthProvider() != provider) {
            throw new BadCredentialsException("Email already registered with another social provider.");
        }

        if (existingUser.getProviderUserId() == null || existingUser.getProviderUserId().isBlank()) {
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
        profile.setTotalXp(0);
        profile.setStreakCount(0);
        userProfileRepository.save(profile);

        return user;
    }

    private User.AuthProvider toAuthProvider(String providerName) {
        return switch (providerName) {
            case "google" -> User.AuthProvider.google;
            case "facebook" -> User.AuthProvider.facebook;
            default -> throw new BadCredentialsException("Unsupported social provider: " + providerName);
        };
    }
}
