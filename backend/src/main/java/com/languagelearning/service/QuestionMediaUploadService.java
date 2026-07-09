package com.languagelearning.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class QuestionMediaUploadService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB
    private static final long MAX_AUDIO_SIZE_BYTES = 10L * 1024 * 1024; // 10MB

    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
    );
    private static final Set<String> ALLOWED_AUDIO_CONTENT_TYPES = Set.of(
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac",
            "audio/x-wav", "audio/wave", "audio/vnd.wave"
    );
    private static final Set<String> ALLOWED_AUDIO_EXTENSIONS = Set.of(
            ".mp3", ".wav", ".ogg", ".aac", ".m4a"
    );

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public QuestionMediaUploadService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    /**
     * Upload ảnh câu hỏi lên thư mục img_file/question/{topicTitle}
     */
    public String uploadQuestionImage(MultipartFile file, String topicTitle) {
        validateImageFile(file);
        Cloudinary cloudinary = buildCloudinaryClient();

        String folder = "img_file/question/" + sanitizeFolderName(topicTitle);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image"
                    )
            );
            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalStateException("Cloudinary did not return secure_url");
            }
            return secureUrl.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to upload question image to Cloudinary", e);
        }
    }

    /**
     * Upload audio câu hỏi lên thư mục audio_file/general_revision/{topicTitle}
     */
    public String uploadQuestionAudio(MultipartFile file, String topicTitle) {
        validateAudioFile(file);
        Cloudinary cloudinary = buildCloudinaryClient();

        String folder = "audio_file/general_revision/" + sanitizeFolderName(topicTitle);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "video"
                    )
            );
            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalStateException("Cloudinary did not return secure_url");
            }
            return secureUrl.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to upload question audio to Cloudinary", e);
        }
    }

    /**
     * Upload audio bài thi (Listening paper) lên thư mục audio_file/exam/{cefrLevel}/{testTitle}
     * Ví dụ: audio_file/exam/A2/Test 1
     * cefrLevel và testTitle giữ nguyên định dạng gốc (không sanitize) để khớp với folder Cloudinary đã có.
     */
    public String uploadExamAudio(MultipartFile file, String cefrLevel, String testTitle) {
        validateAudioFile(file);
        Cloudinary cloudinary = buildCloudinaryClient();

        // Không dùng sanitizeFolderName để giữ đúng định dạng "A2/Test 1"
        String folder = "audio_file/exam/" + cefrLevel + "/" + testTitle;

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "video"  // Cloudinary uses "video" resource_type for audio
                    )
            );
            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalStateException("Cloudinary did not return secure_url");
            }
            return secureUrl.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to upload question audio to Cloudinary", e);
        }
    }

    private String sanitizeFolderName(String name) {
        if (name == null || name.isBlank()) return "unknown";
        // Replace spaces and special chars with hyphens, keep lowercase
        return name.trim().toLowerCase().replaceAll("[^a-z0-9\\-_]", "-");
    }

    private Cloudinary buildCloudinaryClient() {
        if (cloudName == null || cloudName.isBlank()
                || apiKey == null || apiKey.isBlank()
                || apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException(
                    "Cloudinary configuration is missing. Please set cloudinary.cloud-name, cloudinary.api-key and cloudinary.api-secret");
        }
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image must be smaller than 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP and GIF formats are allowed");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Invalid file name");
        }
        String ext = getExtension(originalFilename);
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP and GIF formats are allowed");
        }
    }

    private void validateAudioFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file is required");
        }
        if (file.getSize() > MAX_AUDIO_SIZE_BYTES) {
            throw new IllegalArgumentException("Audio must be smaller than 10MB");
        }
        String contentType = file.getContentType();
        // Some browsers send audio/mpeg for mp3
        if (contentType == null || (!ALLOWED_AUDIO_CONTENT_TYPES.contains(contentType.toLowerCase())
                && !contentType.toLowerCase().startsWith("audio/"))) {
            throw new IllegalArgumentException("Only MP3, WAV, OGG and AAC audio formats are allowed");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Invalid file name");
        }
        String ext = getExtension(originalFilename);
        if (!ALLOWED_AUDIO_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Only MP3, WAV, OGG and AAC audio formats are allowed");
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.toLowerCase().lastIndexOf('.');
        return dotIndex >= 0 ? filename.toLowerCase().substring(dotIndex) : "";
    }
}
