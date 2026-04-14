package com.languagelearning.service.social;

import com.languagelearning.exception.BadCredentialsException;

public interface SocialProviderClient {
    String provider();

    SocialUserInfo getUserInfo(String accessToken);

    default boolean supportsOAuthAuthorizationCode() {
        return false;
    }

    default String exchangeOAuthCode(String code, String redirectUri) {
        throw new BadCredentialsException("Authorization code flow is not supported for this provider");
    }
}
