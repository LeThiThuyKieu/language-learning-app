package com.languagelearning.service.social;

public interface SocialProviderClient {
    String provider();

    SocialUserInfo getUserInfo(String accessToken);
}
