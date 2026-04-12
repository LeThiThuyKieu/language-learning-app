package com.languagelearning.service.social;

import com.languagelearning.exception.BadCredentialsException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class FacebookSocialProviderClient implements SocialProviderClient {
    private static final String FACEBOOK_GRAPH_VERSION = "v20.0";
    private static final String FACEBOOK_USER_INFO_URL =
            "https://graph.facebook.com/" + FACEBOOK_GRAPH_VERSION + "/me";
    private static final String FACEBOOK_DEBUG_TOKEN_URL =
            "https://graph.facebook.com/" + FACEBOOK_GRAPH_VERSION + "/debug_token";
    private static final String FACEBOOK_CODE_EXCHANGE_URL =
            "https://graph.facebook.com/" + FACEBOOK_GRAPH_VERSION + "/oauth/access_token";

    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${social.facebook.app-id:}")
    private String facebookAppId;

    @Value("${social.facebook.app-secret:}")
    private String facebookAppSecret;

    @Override
    public String provider() {
        return "facebook";
    }

    @Override
    public boolean supportsOAuthAuthorizationCode() {
        return true;
    }

    @Override
    public String exchangeOAuthCode(String code, String redirectUri) {
        if (facebookAppId == null || facebookAppId.isBlank() || facebookAppSecret == null || facebookAppSecret.isBlank()) {
            throw new BadCredentialsException("Facebook app credentials are not configured on server");
        }
        if (code == null || code.isBlank() || redirectUri == null || redirectUri.isBlank()) {
            throw new BadCredentialsException("Facebook authorization code and redirect URI are required");
        }

        RestTemplate restTemplate = restTemplateBuilder.build();
        String url = UriComponentsBuilder
                .fromHttpUrl(FACEBOOK_CODE_EXCHANGE_URL)
                .queryParam("client_id", facebookAppId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("client_secret", facebookAppSecret)
                .queryParam("code", code)
                .toUriString();

        try {
            Map<String, Object> body = restTemplate.getForObject(url, Map.class);
            if (body == null || body.get("access_token") == null) {
                throw new BadCredentialsException("Facebook could not exchange authorization code for an access token");
            }
            return String.valueOf(body.get("access_token"));
        } catch (RestClientException ex) {
            throw new BadCredentialsException("Facebook authorization code exchange failed");
        }
    }

    @Override
    public SocialUserInfo getUserInfo(String accessToken) {
        RestTemplate restTemplate = restTemplateBuilder.build();
        validateFacebookToken(restTemplate, accessToken);

        String url = UriComponentsBuilder
                .fromHttpUrl(FACEBOOK_USER_INFO_URL)
                .queryParam("fields", "id,name,email")
                .queryParam("access_token", accessToken)
                .toUriString();

        try {
            Map<String, Object> body = restTemplate.getForObject(url, Map.class);
            if (body == null) {
                throw new BadCredentialsException("Facebook token is invalid");
            }

            String userId = body.get("id") != null ? String.valueOf(body.get("id")) : null;
            String email = body.get("email") != null ? String.valueOf(body.get("email")) : null;
            String fullName = body.get("name") != null ? String.valueOf(body.get("name")) : null;

            if (userId == null || email == null || email.isBlank()) {
                throw new BadCredentialsException("Facebook account does not provide email. Please allow email permission.");
            }

            return new SocialUserInfo(userId, email.toLowerCase(), fullName);
        } catch (RestClientException ex) {
            throw new BadCredentialsException("Facebook token is invalid or expired");
        }
    }

    private void validateFacebookToken(RestTemplate restTemplate, String accessToken) {
        if (facebookAppId == null || facebookAppId.isBlank() || facebookAppSecret == null || facebookAppSecret.isBlank()) {
            throw new BadCredentialsException("Facebook app credentials are not configured on server");
        }

        String appAccessToken = facebookAppId + "|" + facebookAppSecret;
        String debugUrl = UriComponentsBuilder
                .fromHttpUrl(FACEBOOK_DEBUG_TOKEN_URL)
                .queryParam("input_token", accessToken)
                .queryParam("access_token", appAccessToken)
                .toUriString();

        try {
            Map<String, Object> body = restTemplate.getForObject(debugUrl, Map.class);
            if (body == null || !(body.get("data") instanceof Map<?, ?> data)) {
                throw new BadCredentialsException("Facebook token is invalid");
            }

            boolean isValid = Boolean.TRUE.equals(data.get("is_valid"));
            String appId = data.get("app_id") != null ? String.valueOf(data.get("app_id")) : null;

            if (!isValid) {
                throw new BadCredentialsException("Facebook token is invalid or expired");
            }

            if (appId == null || !facebookAppId.trim().equals(appId.trim())) {
                throw new BadCredentialsException("Facebook token audience mismatch");
            }
        } catch (RestClientException ex) {
            throw new BadCredentialsException("Facebook token is invalid or expired");
        }
    }
}
