package com.languagelearning.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SocialLoginRequest {
    @NotBlank(message = "Provider is required")
    private String provider;
    private String accessToken;
    private String oauthCode;
    private String redirectUri;
}
