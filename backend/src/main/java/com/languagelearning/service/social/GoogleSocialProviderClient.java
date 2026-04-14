package com.languagelearning.service.social;

import com.languagelearning.exception.BadCredentialsException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class GoogleSocialProviderClient implements SocialProviderClient {
    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String GOOGLE_TOKEN_INFO_URL = "https://www.googleapis.com/oauth2/v3/tokeninfo";

    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${social.google.client-id:}")
    private String googleClientId;

    @Override
    public String provider() {
        return "google";
    }

    @Override
    public SocialUserInfo getUserInfo(String accessToken) {
        RestTemplate restTemplate = restTemplateBuilder.build();
        validateGoogleTokenAudience(restTemplate, accessToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    GOOGLE_USER_INFO_URL,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new BadCredentialsException("Google token is invalid");
            }

            String userId = body.get("sub") != null ? String.valueOf(body.get("sub")) : null;
            String email = body.get("email") != null ? String.valueOf(body.get("email")) : null;
            String fullName = body.get("name") != null ? String.valueOf(body.get("name")) : null;

            if (userId == null || email == null || email.isBlank()) {
                throw new BadCredentialsException("Google account does not provide enough profile data");
            }

            return new SocialUserInfo(userId, email.toLowerCase(), fullName);
        } catch (RestClientException ex) {
            throw new BadCredentialsException("Google token is invalid or expired");
        }
    }

    private void validateGoogleTokenAudience(RestTemplate restTemplate, String accessToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new BadCredentialsException("Google client id is not configured on server");
        }

        String tokenInfoUrl = UriComponentsBuilder
                .fromHttpUrl(GOOGLE_TOKEN_INFO_URL)
                .queryParam("access_token", accessToken)
                .toUriString();

        try {
            Map<String, Object> tokenInfo = restTemplate.getForObject(tokenInfoUrl, Map.class);
            if (tokenInfo == null) {
                throw new BadCredentialsException("Google token is invalid");
            }

            String aud = tokenInfo.get("aud") != null ? String.valueOf(tokenInfo.get("aud")) : null;
            if (aud == null || !googleClientId.equals(aud)) {
                throw new BadCredentialsException("Google token audience mismatch");
            }
        } catch (RestClientException ex) {
            throw new BadCredentialsException("Google token is invalid or expired");
        }
    }
}
