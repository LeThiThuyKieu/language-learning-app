package com.languagelearning.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;
import java.util.Set;

@Service
public class BadgeImageUploadService {
    private static final long MAX_BADGE_IMAGE_SIZE_BYTES = 2L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
        private static final Set<String> ALLOWED_FILE_EXTENSIONS = Set.of(
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        );

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public BadgeImageUploadService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public String uploadBadgeImage(MultipartFile file) {
        validateBadgeImageFile(file);
        Cloudinary cloudinary = buildCloudinaryClient();

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "img_file/badge",
                            "resource_type", "image"
                    )
            );

            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalStateException("Cloudinary did not return secure_url");
            }

            return secureUrl.toString();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to upload badge image to Cloudinary", exception);
        }
    }

    public void deleteBadgeImageIfManaged(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        String publicId = extractCloudinaryPublicId(imageUrl);
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            Cloudinary cloudinary = buildCloudinaryClient();
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
        } catch (Exception ignored) {
            // Ignore cleanup failures so badge updates are not blocked.
        }
    }

    private Cloudinary buildCloudinaryClient() {
        if (cloudName == null || cloudName.isBlank() || apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException("Cloudinary configuration is missing. Please set cloudinary.cloud-name, cloudinary.api-key and cloudinary.api-secret");
        }

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    private String extractCloudinaryPublicId(String imageUrl) {
        try {
            URI uri = new URI(imageUrl);
            String host = uri.getHost();
            if (host == null || !host.toLowerCase().contains("res.cloudinary.com")) {
                return null;
            }

            String path = uri.getPath();
            if (path == null || !path.contains("/img_file/badge/")) {
                return null;
            }

            int uploadIndex = path.indexOf("/upload/");
            if (uploadIndex < 0) {
                return null;
            }

            String afterUpload = path.substring(uploadIndex + "/upload/".length());
            afterUpload = afterUpload.replaceFirst("^v\\d+/", "");

            if (!afterUpload.startsWith("img_file/badge/")) {
                return null;
            }

            int dotIndex = afterUpload.lastIndexOf('.');
            if (dotIndex > 0) {
                return afterUpload.substring(0, dotIndex);
            }

            return afterUpload;
        } catch (URISyntaxException exception) {
            return null;
        }
    }

    private void validateBadgeImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Badge image file is required");
        }

        if (file.getSize() > MAX_BADGE_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Badge image must be smaller than 2MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPG/JPEG, PNG and WEBP formats are allowed");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String lowerCaseName = originalFilename.toLowerCase();
        int extensionIndex = lowerCaseName.lastIndexOf('.');
        String extension = extensionIndex >= 0 ? lowerCaseName.substring(extensionIndex) : "";
        if (!ALLOWED_FILE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only JPG/JPEG, PNG and WEBP formats are allowed");
        }
    }
}