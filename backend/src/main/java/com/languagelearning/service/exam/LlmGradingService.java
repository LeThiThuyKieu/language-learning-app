package com.languagelearning.service.exam;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.languagelearning.dto.exam.GradeResponse;
import com.languagelearning.dto.exam.SpeakingGradeRequest;
import com.languagelearning.dto.exam.WritingGradeRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * LLM Grading Service — gọi OpenAI để chấm Writing và Speaking theo chuẩn Cambridge.
 *
 * Writing: 4 tiêu chí Cambridge (Content, Communicative Achievement, Organisation, Language).
 *          Kiểm tra word count so với yêu cầu.
 *
 * Speaking: Ghi âm xuyên suốt 1 Part → 1 transcript → LLM đánh giá độ tương đồng.
 *           Tính % câu hỏi thí sinh trả lời được, kết hợp chất lượng giao tiếp.
 *           Không dùng 4 tiêu chí Cambridge cứng — đánh giá theo câu hỏi cụ thể từ MongoDB.
 */
@Service
@Slf4j
public class LlmGradingService {

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // WRITING
    public GradeResponse gradeWriting(WritingGradeRequest req) {
        int wordCount = countWords(req.getUserAnswer());

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[LlmGrading] openai.api-key chưa được cấu hình — bài Writing không được chấm.");
            return fallbackWriting(wordCount);
        }

        log.info("[LlmGrading] Bắt đầu chấm Writing — mongoDocId={}, wordCount={}", req.getMongoDocId(), wordCount);
        try {
            String raw = callOpenAi(buildWritingSystemPrompt(), buildWritingUserPrompt(req, wordCount));
            GradeResponse result = parseWritingResponse(raw, wordCount);
            log.info("[LlmGrading] Writing xong — score={}", result.getScore());
            return result;
        } catch (Exception e) {
            log.error("[LlmGrading] Writing error (mongoDocId={}): {}", req.getMongoDocId(), e.getMessage(), e);
            return fallbackWriting(wordCount);
        }
    }

    private String buildWritingSystemPrompt() {
        return """
            Bạn là giáo viên chấm bài thi Writing theo chuẩn Cambridge Key/Preliminary/First.
            
            Nhiệm vụ: đọc đề bài và bài làm, chấm điểm theo thang 0–100 (trung bình 4 tiêu chí).
            
            Tiêu chí chấm Cambridge (mỗi tiêu chí 0–100, trọng số đều nhau):
            1. Content (nội dung): Bài có đáp ứng đủ yêu cầu đề bài? Có đề cập đủ các điểm bullet point không?
               - Trừ điểm nếu thiếu bullet point, lạc đề, quá ngắn so với yêu cầu.
            2. Communicative Achievement (giao tiếp): Bài có phù hợp với thể loại (email/story)? Tone có phù hợp không?
               - Email: có đầy đủ lời chào, kết thúc không? Story: có dẫn chuyện hấp dẫn không?
            3. Organisation (tổ chức): Bài có cấu trúc rõ ràng? Có dùng từ nối không? Đoạn văn có mạch lạc không?
            4. Language (ngôn ngữ): Ngữ pháp, từ vựng, chính tả có đúng không? Có đa dạng cấu trúc câu không?
            
            QUAN TRỌNG — Kiểm tra số từ:
            - Nếu bài thiếu từ so với yêu cầu → trừ tối đa 20 điểm từ Content.
            - Nếu bài quá dài hơn max_words → nhắc nhở nhưng không trừ điểm nhiều.
            
            Trả lời bằng JSON thuần (không markdown, không code block):
            {
              "score": <số nguyên 0-100, là trung bình 4 tiêu chí>,
              "feedback": "<nhận xét 2-3 câu tiếng Việt, cụ thể, chỉ ra điểm mạnh và điểm cần cải thiện>",
              "breakdown": {
                "content": <0-100>,
                "communicative_achievement": <0-100>,
                "organisation": <0-100>,
                "language": <0-100>
              },
              "word_count_ok": <true/false, dựa trên yêu cầu số từ>,
              "suggestion": "<1-2 câu gợi ý cải thiện cụ thể, bằng tiếng Việt>"
            }
            """;
    }

    private String buildWritingUserPrompt(WritingGradeRequest req, int wordCount) {
        StringBuilder sb = new StringBuilder("=== ĐỀ BÀI ===\n");

        if (req.getWriteType() != null) {
            sb.append("Thể loại: ").append("EMAIL".equals(req.getWriteType()) ? "Email" : "Story / Bài văn").append("\n");
        }
        if (req.getPromptText() != null && !req.getPromptText().isBlank()) {
            sb.append("Đề bài: ").append(req.getPromptText()).append("\n");
        }
        if (req.getBulletPoints() != null && !req.getBulletPoints().isEmpty()) {
            sb.append("Các điểm bắt buộc đề cập:\n");
            for (int i = 0; i < req.getBulletPoints().size(); i++) {
                sb.append("  ").append(i + 1).append(". ").append(req.getBulletPoints().get(i)).append("\n");
            }
        }
        if (req.getMinWords() != null) {
            sb.append("Yêu cầu số từ: ít nhất ").append(req.getMinWords());
            if (req.getMaxWords() != null) sb.append(", tối đa ").append(req.getMaxWords());
            sb.append(" từ.\n");
        }
        if (req.getCorrectAnswer() != null && !req.getCorrectAnswer().isBlank()) {
            sb.append("Bài tham khảo: ").append(req.getCorrectAnswer()).append("\n");
        }

        sb.append("\n=== BÀI LÀM ===\n");
        sb.append("Số từ hiện tại: ").append(wordCount).append("\n\n");
        sb.append(req.getUserAnswer() != null ? req.getUserAnswer().trim() : "(Không có bài làm)");
        return sb.toString();
    }

    private GradeResponse parseWritingResponse(String raw, int wordCount) throws Exception {
        JsonNode root = objectMapper.readTree(raw);
        int score       = root.path("score").asInt(50);
        String feedback = root.path("feedback").asText("Không có nhận xét.");
        String suggestion = root.path("suggestion").asText(null);

        String breakdown = null;
        JsonNode bk = root.path("breakdown");
        if (!bk.isMissingNode() && !bk.isNull()) {
            breakdown = objectMapper.writeValueAsString(bk);
        }
        return new GradeResponse(score, feedback, breakdown, suggestion, wordCount);
    }

    private GradeResponse fallbackWriting(int wordCount) {
        return new GradeResponse(0, "Không thể chấm bài tự động.", null, null, wordCount);
    }

    // SPEAKING

    /**
     * Chấm Speaking — 1 transcript cho toàn bộ Part.
     * LLM đánh giá theo các câu sẵn và kiểm tra coverage các câu hỏi sẵn đó
     */
    public GradeResponse gradeSpeaking(SpeakingGradeRequest req) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[LlmGrading] openai.api-key chưa được cấu hình — bài Speaking không được chấm.");
            return fallbackSpeaking();
        }
        if (req.getTranscript() == null || req.getTranscript().isBlank()) {
            return new GradeResponse(0, "Không nhận được nội dung ghi âm. Hãy thử lại.", null, null, null);
        }

        log.info("[LlmGrading] Bắt đầu chấm Speaking — part={}, transcriptLen={}",
            req.getPartNumber(), req.getTranscript().length());
        try {
            String raw = callOpenAi(buildSpeakingSystemPrompt(), buildSpeakingUserPrompt(req));
            GradeResponse result = parseSpeakingResponse(raw);
            log.info("[LlmGrading] Speaking xong — score={}", result.getScore());
            return result;
        } catch (Exception e) {
            log.error("[LlmGrading] Speaking error (part={}): {}", req.getPartNumber(), e.getMessage(), e);
            return fallbackSpeaking();
        }
    }

    private String buildSpeakingSystemPrompt() {
        return """
            Bạn là giám khảo chấm thi Speaking theo chuẩn Cambridge (Key/Preliminary/First).
            
            Nhiệm vụ: đọc transcript của thí sinh và danh sách câu hỏi trong Part, chấm điểm độ tương đồng (0–100%).
            
            Cách chấm điểm:
            - Với mỗi câu hỏi trong danh sách, kiểm tra xem thí sinh có đề cập / trả lời câu đó trong transcript không.
            - Tính tỷ lệ câu được trả lời / tổng số câu → nhân 100 = điểm cơ bản.
            - Điều chỉnh thêm dựa trên:
              + Chất lượng câu trả lời (đủ ý, rõ ràng, liên quan)
              + Ngữ pháp và từ vựng cơ bản
              + Sự trôi chảy (không quá ít chữ)
            
            QUAN TRỌNG:
            - Nếu transcript rất ngắn (< 10 từ) hoặc trống → score < 20.
            - Không cần tiêu chí Cambridge phức tạp — chỉ tập trung vào: thí sinh có trả lời được các câu hỏi không.
            - Đây là bài thi tự luyện, đánh giá friendly và động viên.
            
            Trả lời bằng JSON thuần (không markdown, không code block):
            {
              "score": <số nguyên 0-100, là % tổng thể thí sinh trả lời được các câu hỏi>,
              "feedback": "<nhận xét 2-3 câu tiếng Việt: thí sinh trả lời được bao nhiêu câu, điểm tốt, điểm cần cải thiện>",
              "breakdown": {
                "questions_covered": <số câu hỏi được trả lời, 0-100 scale>,
                "clarity": <độ rõ ràng 0-100>,
                "fluency": <độ trôi chảy 0-100>,
                "language": <ngữ pháp và từ vựng 0-100>
              },
              "questions_covered": <số câu hỏi thí sinh đã đề cập tới, integer>,
              "suggestion": "<1 câu gợi ý cải thiện cụ thể bằng tiếng Việt>"
            }
            """;
    }

    private String buildSpeakingUserPrompt(SpeakingGradeRequest req) {
        StringBuilder sb = new StringBuilder("=== THÔNG TIN PHẦN THI ===\n");

        if (req.getPartContext() != null && !req.getPartContext().isBlank()) {
            sb.append("Part: ").append(req.getPartContext()).append("\n");
        }
        if (req.getPartNumber() != null) {
            sb.append("Part number: ").append(req.getPartNumber()).append("\n");
        }
        if (req.getPartDurationMinutes() != null) {
            sb.append("Thời lượng: ").append(req.getPartDurationMinutes()).append(" phút\n");
        }

        if (req.getAllQuestionsText() != null && !req.getAllQuestionsText().isEmpty()) {
            sb.append("\n=== DANH SÁCH CÂU HỎI TRONG PART NÀY (").append(req.getAllQuestionsText().size()).append(" câu) ===\n");
            for (int i = 0; i < req.getAllQuestionsText().size(); i++) {
                sb.append(i + 1).append(". ").append(req.getAllQuestionsText().get(i)).append("\n");
            }
            sb.append("→ Thí sinh được kỳ vọng trả lời tất cả ").append(req.getAllQuestionsText().size()).append(" câu trên.\n");
        }

        sb.append("\n=== TRANSCRIPT (những gì thí sinh đã nói) ===\n");
        sb.append(req.getTranscript().trim());
        return sb.toString();
    }

    private GradeResponse parseSpeakingResponse(String raw) throws Exception {
        JsonNode root    = objectMapper.readTree(raw);
        int    score     = root.path("score").asInt(50);
        String feedback  = root.path("feedback").asText("Không có nhận xét.");
        String suggestion = root.path("suggestion").asText(null);

        String breakdown = null;
        JsonNode bk = root.path("breakdown");
        if (!bk.isMissingNode() && !bk.isNull()) {
            breakdown = objectMapper.writeValueAsString(bk);
        }
        // Speaking không có word count nhưng có suggestion
        return new GradeResponse(score, feedback, breakdown, suggestion, null);
    }

    private GradeResponse fallbackSpeaking() {
        return new GradeResponse(0, "Không thể chấm bài tự động.", null, null, null);
    }

    // LLM HTTP call — hỗ trợ cả OpenAI và Gemini
    private String callOpenAi(String systemPrompt, String userPrompt) throws Exception {
        // Gemini format
        if (model != null && model.startsWith("gemini")) {
            return callGemini(systemPrompt, userPrompt);
        }
        // Groq hoặc OpenAI — cùng format, chỉ khác URL
        String url = (model != null && (model.startsWith("llama") || model.startsWith("mixtral")
            || model.startsWith("gemma") || model.startsWith("deepseek")))
            ? GROQ_URL : OPENAI_URL;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", 0.2);
        body.put("max_tokens", 800);
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user",   "content", userPrompt)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("LLM error (" + url + "): " + response.getStatusCode());
        }

        JsonNode root  = objectMapper.readTree(response.getBody());
        String content = root.path("choices").path(0).path("message").path("content").asText("").trim();
        log.debug("[LlmGrading] raw: {}", content);
        return stripCodeBlock(content);
    }

    /**
     * Gọi Google Gemini API (generateContent endpoint).
     * Format: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
     */
    private String callGemini(String systemPrompt, String userPrompt) throws Exception {
        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
            + model + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Gemini dùng "contents" array, system instruction tách riêng
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("system_instruction", Map.of(
            "parts", List.of(Map.of("text", systemPrompt))
        ));
        body.put("contents", List.of(
            Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))
        ));
        body.put("generationConfig", Map.of(
            "temperature", 0.2,
            "maxOutputTokens", 800,
            "responseMimeType", "application/json"
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(geminiUrl, HttpMethod.POST, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini error: " + response.getStatusCode());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        String content = root.path("candidates").path(0)
            .path("content").path("parts").path(0).path("text").asText("").trim();
        log.debug("[LlmGrading] Gemini raw: {}", content);
        return stripCodeBlock(content);
    }

    private String stripCodeBlock(String content) {
        if (content.startsWith("```")) {
            content = content.replaceAll("^```(?:json)?\\s*", "").replaceAll("```\\s*$", "").trim();
        }
        return content;
    }

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }
}
