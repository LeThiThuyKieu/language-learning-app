package com.languagelearning.config;

import com.languagelearning.dto.AuthResponse;
import com.languagelearning.service.social.SocialAuthService;
import com.languagelearning.service.social.SocialUserInfo;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    private final SocialAuthService socialAuthService;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/login}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken oauth2Authentication)) {
                redirectToError(response, "invalid_oauth2_authentication");
                return;
            }

            OAuth2User oauth2User = oauth2Authentication.getPrincipal();
            String registrationId = oauth2Authentication.getAuthorizedClientRegistrationId().toLowerCase(Locale.ROOT);
            SocialUserInfo userInfo = toSocialUserInfo(registrationId, oauth2User.getAttributes());
            AuthResponse authResponse = socialAuthService.loginWithOAuth2(registrationId, userInfo);

            response.sendRedirect(buildSuccessRedirect(authResponse));
        } catch (Exception ex) {
            redirectToError(response, ex.getMessage());
        }
    }

    private SocialUserInfo toSocialUserInfo(String registrationId, Map<String, Object> attributes) {
        String providerUserId = switch (registrationId) {
            case "google" -> readAttribute(attributes, "sub");
            case "facebook" -> readAttribute(attributes, "id");
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + registrationId);
        };

        String email = readAttribute(attributes, "email");
        String fullName = readAttribute(attributes, "name");

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("OAuth2 provider did not return an email address");
        }

        return new SocialUserInfo(providerUserId, email.toLowerCase(Locale.ROOT), fullName);
    }

    private String readAttribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String buildSuccessRedirect(AuthResponse authResponse) {
        return UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", authResponse.getToken())
                .queryParam("refreshToken", authResponse.getRefreshToken())
                .build()
                .encode()
                .toUriString();
    }

    private void redirectToError(HttpServletResponse response, String error) throws IOException {
        String redirectUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("error", error == null || error.isBlank() ? "oauth2_login_failed" : error)
                .build()
                .encode()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}