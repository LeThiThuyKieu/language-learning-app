package com.languagelearning.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.languagelearning.document.VocabularyCache;
import com.languagelearning.dto.VocabularyDetailDto;
import com.languagelearning.repository.mongo.VocabularyCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 2-layer caching cho vocabulary lookup:
 *   Layer 1: Redis  (MGET — cực nhanh, ~1ms)
 *   Layer 2: MongoDB (findByWordIn — nhanh, ~5-20ms)
 *   Fallback: External API (Google Translate + Dictionary API — chậm, ~200-500ms)
 *
 * Kết quả từ Layer 2/3 được đẩy ngược vào Redis để lần sau không phải gọi lại.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VocabularyLookupService {

    private static final String REDIS_KEY_PREFIX = "vocab:";
    private static final long REDIS_TTL_HOURS = 24;

    private final StringRedisTemplate redisTemplate;
    private final VocabularyCacheRepository vocabCacheRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Điểm vào chính: nhận danh sách từ, trả về map word → detail.
     * Xử lý theo batch để tối ưu số lần query.
     */
    public Map<String, VocabularyDetailDto> lookupWords(List<String> words) {
        if (words == null || words.isEmpty()) return Collections.emptyMap();

        // Normalize: lowercase, trim, loại trùng
        List<String> normalized = words.stream()
                .map(w -> w.toLowerCase().trim())
                .filter(w -> !w.isBlank())
                .distinct()
                .collect(Collectors.toList());

        Map<String, VocabularyDetailDto> result = new HashMap<>();
        List<String> cacheMiss = new ArrayList<>();

        // ── Layer 1: Redis MGET ──────────────────────────────────────────────
        List<String> redisKeys = normalized.stream()
                .map(w -> REDIS_KEY_PREFIX + w)
                .collect(Collectors.toList());

        List<String> redisValues = redisTemplate.opsForValue().multiGet(redisKeys);

        for (int i = 0; i < normalized.size(); i++) {
            String word = normalized.get(i);
            String cached = (redisValues != null) ? redisValues.get(i) : null;
            if (cached != null) {
                result.put(word, deserialize(cached, word));
                log.debug("[Redis HIT] word={}", word);
            } else {
                cacheMiss.add(word);
            }
        }

        if (cacheMiss.isEmpty()) return result;

        // ── Layer 2: MongoDB findByWordIn ────────────────────────────────────
        List<VocabularyCache> dbResults = vocabCacheRepository.findByWordIn(cacheMiss);
        Set<String> foundInDb = new HashSet<>();

        for (VocabularyCache vc : dbResults) {
            VocabularyDetailDto dto = new VocabularyDetailDto(vc.getWord(), vc.getMeaning(), vc.getPhonetic());
            result.put(vc.getWord(), dto);
            foundInDb.add(vc.getWord());
            // Đẩy lại vào Redis
            saveToRedis(vc.getWord(), dto);
            log.debug("[MongoDB HIT] word={}", vc.getWord());
        }

        List<String> apiMiss = cacheMiss.stream()
                .filter(w -> !foundInDb.contains(w))
                .collect(Collectors.toList());

        if (apiMiss.isEmpty()) return result;

        // Fallback: External API (chạy song song)
        log.info("[External API] fetching {} words: {}", apiMiss.size(), apiMiss);
        for (String word : apiMiss) {
            try {
                VocabularyDetailDto dto = fetchFromExternalApi(word);
                result.put(word, dto);
                // Lưu vào MongoDB
                saveToMongo(word, dto);
                // Lưu vào Redis
                saveToRedis(word, dto);
            } catch (Exception e) {
                log.warn("[External API] failed for word={}: {}", word, e.getMessage());
                result.put(word, new VocabularyDetailDto(word, "", ""));
            }
        }

        return result;
    }

    // External API calls

    private VocabularyDetailDto fetchFromExternalApi(String word) throws Exception {
        String meaning = fetchMeaning(word);
        String phonetic = fetchPhonetic(word);
        return new VocabularyDetailDto(word, meaning, phonetic);
    }

    /** Google Translate unofficial endpoint — dịch sang tiếng Việt */
    private String fetchMeaning(String word) {
        try {
            String url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q="
                    + java.net.URLEncoder.encode(word, java.nio.charset.StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET().build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                String translated = root.path(0).path(0).path(0).asText("");
                return translated.equalsIgnoreCase(word) ? "" : translated;
            }
        } catch (Exception e) {
            log.warn("[Google Translate] error for word={}: {}", word, e.getMessage());
        }
        return "";
    }

    /** Free Dictionary API — lấy phiên âm IPA */
    private String fetchPhonetic(String word) {
        try {
            String url = "https://api.dictionaryapi.dev/api/v2/entries/en/"
                    + java.net.URLEncoder.encode(word, java.nio.charset.StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET().build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                // Lấy phonetic đầu tiên có text
                String phonetic = root.path(0).path("phonetic").asText("");
                if (phonetic.isBlank()) {
                    JsonNode phonetics = root.path(0).path("phonetics");
                    for (JsonNode p : phonetics) {
                        String t = p.path("text").asText("");
                        if (!t.isBlank()) { phonetic = t; break; }
                    }
                }
                return phonetic;
            }
        } catch (Exception e) {
            log.warn("[Dictionary API] error for word={}: {}", word, e.getMessage());
        }
        return "";
    }

    // Helpers

    private void saveToRedis(String word, VocabularyDetailDto dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForValue().set(REDIS_KEY_PREFIX + word, json, REDIS_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("[Redis] save failed for word={}: {}", word, e.getMessage());
        }
    }

    private void saveToMongo(String word, VocabularyDetailDto dto) {
        try {
            VocabularyCache vc = vocabCacheRepository.findByWord(word)
                    .orElse(new VocabularyCache());
            vc.setWord(word);
            vc.setMeaning(dto.getMeaning());
            vc.setPhonetic(dto.getPhonetic());
            vc.setUpdatedAt(LocalDateTime.now());
            if (vc.getCreatedAt() == null) vc.setCreatedAt(LocalDateTime.now());
            vocabCacheRepository.save(vc);
        } catch (Exception e) {
            log.warn("[MongoDB] save failed for word={}: {}", word, e.getMessage());
        }
    }

    private VocabularyDetailDto deserialize(String json, String word) {
        try {
            return objectMapper.readValue(json, VocabularyDetailDto.class);
        } catch (Exception e) {
            return new VocabularyDetailDto(word, "", "");
        }
    }
}
