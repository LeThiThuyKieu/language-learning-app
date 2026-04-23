package com.languagelearning.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.languagelearning.document.Question;
import com.languagelearning.dto.learning.EnrichedQuestionDto;
import com.languagelearning.dto.learning.NodeQuestionsDto;
import com.languagelearning.dto.learning.SkillTreeQuestionsResponse;
import com.languagelearning.entity.QuestionIndex;
import com.languagelearning.entity.QuestionType;
import com.languagelearning.entity.SkillNode;
import com.languagelearning.entity.SkillTree;
import com.languagelearning.entity.UserLevelQuestionSnapshot;
import com.languagelearning.repository.mongo.QuestionRepository;
import com.languagelearning.repository.mysql.QuestionIndexRepository;
import com.languagelearning.repository.mysql.SkillNodeRepository;
import com.languagelearning.repository.mysql.SkillTreeRepository;
import com.languagelearning.repository.mysql.UserLevelQuestionSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Lấy bộ câu hỏi mẫu cho một skill tree (và theo level)
 *   Mỗi tree 5 node: VOCAB, LISTENING, SPEAKING, MATCHING, REVIEW
 *   VOCAB: 10 câu; LISTENING: 1; SPEAKING: 1; MATCHING: 10 (theo node_id trong MySQL)
 *   REVIEW: 4 VOCAB + 4 MATCHING + 1 LISTENING + 1 SPEAKING ngẫu nhiên trong cùng level,
 *   không trùng id với câu đã dùng ở 4 node trước của cùng tree
 *
 * Cache: Redis (TTL 1h) → MySQL snapshot → Build fresh
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SkillTreeQuestionService {
    private static final String REDIS_KEY_PREFIX = "level:questions:";
    private static final long REDIS_TTL_HOURS = 1;

    private final SkillTreeRepository skillTreeRepository;
    private final SkillNodeRepository skillNodeRepository;
    private final QuestionIndexRepository questionIndexRepository;
    private final QuestionRepository questionRepository;
    private final UserLevelQuestionSnapshotRepository userLevelQuestionSnapshotRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Bộ câu cho một tree: lấy từ snapshot level của user (cùng bộ như lần đầu vào /learn).
     */
    @Transactional
    public SkillTreeQuestionsResponse getSampleQuestionsForTreeForUser(Integer userId, Integer treeId) {
        SkillTree tree = skillTreeRepository.findById(treeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill tree not found: " + treeId));
        Integer levelId = tree.getLevel() != null ? tree.getLevel().getId() : null;
        if (levelId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skill tree has no level");
        }
        List<SkillTreeQuestionsResponse> levelTrees = getOrCreateLevelSnapshot(userId, levelId);
        return levelTrees.stream()
                .filter(t -> treeId.equals(t.getTreeId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill tree not found in snapshot: " + treeId));
    }

    /**
     * Sinh ngẫu nhiên một lần cho (user, level), sau đó luôn trả về JSON đã lưu.
     * Cache: Redis (1h) → MySQL snapshot → Build fresh
     */
    @Transactional
    public List<SkillTreeQuestionsResponse> getOrCreateLevelSnapshot(Integer userId, Integer levelId) {
        String redisKey = REDIS_KEY_PREFIX + userId + ":" + levelId;

        // Layer 1: Redis
        String cached = redisTemplate.opsForValue().get(redisKey);
        if (cached != null) {
            try {
                log.debug("[Redis HIT] level questions userId={} levelId={}", userId, levelId);
                return objectMapper.readValue(cached, new TypeReference<List<SkillTreeQuestionsResponse>>() {});
            } catch (JsonProcessingException e) {
                log.warn("[Redis] deserialize failed, fallback to MySQL: {}", e.getMessage());
            }
        }

        // Layer 2: MySQL snapshot
        Optional<UserLevelQuestionSnapshot> existing = userLevelQuestionSnapshotRepository.findByUserIdAndLevelId(userId, levelId);
        List<SkillTreeQuestionsResponse> result;
        if (existing.isPresent()) {
            try {
                result = objectMapper.readValue(
                        existing.get().getPayloadJson(),
                        new TypeReference<List<SkillTreeQuestionsResponse>>() {}
                );
                log.debug("[MySQL HIT] level questions userId={} levelId={}", userId, levelId);
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid stored lesson snapshot");
            }
        } else {
            // Layer 3: Build fresh
            log.info("[Build fresh] level questions userId={} levelId={}", userId, levelId);
            result = buildSampleQuestionsByLevel(levelId);
            try {
                String json = objectMapper.writeValueAsString(result);
                UserLevelQuestionSnapshot row = new UserLevelQuestionSnapshot();
                row.setUserId(userId);
                row.setLevelId(levelId);
                row.setPayloadJson(json);
                userLevelQuestionSnapshotRepository.save(row);
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Cannot save lesson snapshot");
            }
        }

        // Write-back to Redis
        try {
            String json = objectMapper.writeValueAsString(result);
            redisTemplate.opsForValue().set(redisKey, json, REDIS_TTL_HOURS, TimeUnit.HOURS);
            log.debug("[Redis] cached level questions userId={} levelId={}", userId, levelId);
        } catch (JsonProcessingException e) {
            log.warn("[Redis] cache write failed: {}", e.getMessage());
        }

        return result;
    }

    /**
     * Invalidate Redis cache khi user complete node — gọi từ ProgressService
     */
    public void invalidateLevelCache(Integer userId, Integer levelId) {
        String redisKey = REDIS_KEY_PREFIX + userId + ":" + levelId;
        redisTemplate.delete(redisKey);
        log.info("[Redis] invalidated level questions userId={} levelId={}", userId, levelId);
    }

    @Transactional(readOnly = true)
    public SkillTreeQuestionsResponse getSampleQuestionsForTree(Integer treeId) {
        SkillTree tree = skillTreeRepository.findById(treeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill tree not found: " + treeId));
        Integer levelId = tree.getLevel() != null ? tree.getLevel().getId() : null;
        if (levelId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skill tree has no level");
        }
        List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(treeId);
        return buildTreeResponse(treeId, levelId, nodes);
    }

    @Transactional(readOnly = true)
    public List<SkillTreeQuestionsResponse> getSampleQuestionsByLevel(Integer levelId) {
        return buildSampleQuestionsByLevel(levelId);
    }

    private List<SkillTreeQuestionsResponse> buildSampleQuestionsByLevel(Integer levelId) {
        List<SkillTree> trees = skillTreeRepository.findByLevel_IdOrderByOrderIndex(levelId);
        List<SkillTreeQuestionsResponse> out = new ArrayList<>();
        for (SkillTree tree : trees) {
            List<SkillNode> nodes = skillNodeRepository.findBySkillTree_IdOrderByOrderIndex(tree.getId());
            out.add(buildTreeResponse(tree.getId(), levelId, nodes));
        }
        return out;
    }

    private SkillTreeQuestionsResponse buildTreeResponse(Integer treeId, Integer levelId, List<SkillNode> nodes) {
        List<NodeQuestionsDto> resultNodes = new ArrayList<>();
        Set<Long> usedQuestionIds = new HashSet<>();
        Map<QuestionType, List<EnrichedQuestionDto>> questionsByType = new EnumMap<>(QuestionType.class);

        SkillNode reviewNode = null;
        for (SkillNode node : nodes) {
            if (node.getNodeType() == SkillNode.NodeType.REVIEW) {
                reviewNode = node;
                continue;
            }
            int limit = switch (node.getNodeType()) {
                case LISTENING, SPEAKING -> 1;
                case VOCAB, MATCHING -> 10;
                default -> 10;
            };
            List<QuestionIndex> rows = questionIndexRepository.findRandomByLevelAndNode(levelId, node.getId(), limit);
            List<EnrichedQuestionDto> enriched = enrichFromMongo(rows);
            resultNodes.add(NodeQuestionsDto.builder()
                    .nodeId(node.getId())
                    .title(node.getTitle())
                    .nodeType(node.getNodeType().name())
                    .questions(enriched)
                    .build());
            mapQuestionTypeFromNode(node, questionsByType, enriched);
            rows.forEach(q -> usedQuestionIds.add(q.getId()));
        }

        if (reviewNode != null) {
            List<EnrichedQuestionDto> reviewQuestions = buildReviewQuestions(levelId, usedQuestionIds, questionsByType);
            resultNodes.add(NodeQuestionsDto.builder()
                    .nodeId(reviewNode.getId())
                    .title(reviewNode.getTitle())
                    .nodeType(reviewNode.getNodeType().name())
                    .questions(reviewQuestions)
                    .build());
        }

        return SkillTreeQuestionsResponse.builder()
                .treeId(treeId)
                .levelId(levelId)
                .nodes(resultNodes)
                .build();
    }

    private void mapQuestionTypeFromNode(
            SkillNode node,
            Map<QuestionType, List<EnrichedQuestionDto>> questionsByType,
            List<EnrichedQuestionDto> enriched
    ) {
        QuestionType qt = switch (node.getNodeType()) {
            case VOCAB -> QuestionType.VOCAB;
            case LISTENING -> QuestionType.LISTENING;
            case SPEAKING -> QuestionType.SPEAKING;
            case MATCHING -> QuestionType.MATCHING;
            default -> null;
        };
        if (qt != null) {
            questionsByType.put(qt, enriched);
        }
    }

    private List<EnrichedQuestionDto> buildReviewQuestions(
            Integer levelId,
            Set<Long> usedQuestionIds,
            Map<QuestionType, List<EnrichedQuestionDto>> questionsByType
    ) {
        List<EnrichedQuestionDto> review = new ArrayList<>();
        Set<Long> exclude = new HashSet<>(usedQuestionIds);

        if (!questionsByType.getOrDefault(QuestionType.VOCAB, List.of()).isEmpty()) {
            List<EnrichedQuestionDto> part = sampleReviewByType(levelId, QuestionType.VOCAB, exclude, 4);
            review.addAll(part);
            part.stream().map(EnrichedQuestionDto::getId).filter(Objects::nonNull).forEach(exclude::add);
        }
        if (!questionsByType.getOrDefault(QuestionType.MATCHING, List.of()).isEmpty()) {
            List<EnrichedQuestionDto> part = sampleReviewByType(levelId, QuestionType.MATCHING, exclude, 4);
            review.addAll(part);
            part.stream().map(EnrichedQuestionDto::getId).filter(Objects::nonNull).forEach(exclude::add);
        }
        if (!questionsByType.getOrDefault(QuestionType.LISTENING, List.of()).isEmpty()) {
            List<EnrichedQuestionDto> part = sampleReviewByType(levelId, QuestionType.LISTENING, exclude, 1);
            review.addAll(part);
            part.stream().map(EnrichedQuestionDto::getId).filter(Objects::nonNull).forEach(exclude::add);
        }
        if (!questionsByType.getOrDefault(QuestionType.SPEAKING, List.of()).isEmpty()) {
            List<EnrichedQuestionDto> part = sampleReviewByType(levelId, QuestionType.SPEAKING, exclude, 1);
            review.addAll(part);
            part.stream().map(EnrichedQuestionDto::getId).filter(Objects::nonNull).forEach(exclude::add);
        }
        return review;
    }

    private List<EnrichedQuestionDto> sampleReviewByType(
            Integer levelId,
            QuestionType type,
            Set<Long> exclude,
            int limit
    ) {
        List<Long> excludeList = new ArrayList<>(exclude);
        List<QuestionIndex> rows;
        if (excludeList.isEmpty()) {
            rows = questionIndexRepository.findRandomByLevelAndType(levelId, type.name(), limit);
        } else {
            rows = questionIndexRepository.findRandomByLevelAndTypeExcludingIds(levelId, type.name(), excludeList, limit);
        }
        return enrichFromMongo(rows);
    }

    /** Lấy ra thông tin question, kết hợp MySQL và MongoDB */
    public List<EnrichedQuestionDto> enrichQuestionRows(List<QuestionIndex> rows) {
        return enrichFromMongo(rows);
    }

    private List<EnrichedQuestionDto> enrichFromMongo(List<QuestionIndex> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<String> mongoIds = rows.stream()
                .map(QuestionIndex::getMongoQuestionId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<String, Question> byId = new HashMap<>();
        if (!mongoIds.isEmpty()) {
            questionRepository.findAllById(mongoIds).forEach(q -> byId.put(q.getId(), q));
        }
        List<EnrichedQuestionDto> out = new ArrayList<>();
        for (QuestionIndex row : rows) {
            Question doc = byId.get(row.getMongoQuestionId());
            String text = doc != null && doc.getQuestionText() != null ? doc.getQuestionText() : "";
            List<String> options = new ArrayList<>();
            if (doc != null) {
                if (doc.getOptions() != null) {
                    options.addAll(doc.getOptions());
                }
                if (options.isEmpty() && doc.getOptionsAlt() != null) {
                    options.addAll(doc.getOptionsAlt());
                }
            }
            String correct = row.getCorrectAnswer() != null ? row.getCorrectAnswer() : "";
            if (doc != null && doc.getCorrectAnswers() != null && !doc.getCorrectAnswers().isEmpty() && correct.isEmpty()) {
                correct = String.join(" | ", doc.getCorrectAnswers());
            }
            String qType = row.getQuestionType() != null ? row.getQuestionType().name() : "";
            String audioUrl = null;
            String phonetic = null;
            if (doc != null && doc.getMetadata() != null) {
                audioUrl = doc.getMetadata().getAudioUrl();
                phonetic = doc.getMetadata().getPhonetic();
            }
            out.add(EnrichedQuestionDto.builder()
                    .id(row.getId())
                    .mongoQuestionId(row.getMongoQuestionId())
                    .questionText(text)
                    .options(options)
                    .correctAnswer(correct)
                    .questionType(qType)
                    .audioUrl(audioUrl)
                    .phonetic(phonetic)
                    .build());
        }
        return out;
    }
}
