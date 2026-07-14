package com.languagelearning.service.admin;

import com.languagelearning.dto.admin.exam_progress.ExamProgressDetailDto;
import com.languagelearning.dto.admin.exam_progress.ExamProgressStatsDto;
import com.languagelearning.dto.admin.exam_progress.ExamProgressSummaryDto;
import com.languagelearning.entity.ExamTest;
import com.languagelearning.entity.UserExamAttempt;
import com.languagelearning.entity.UserProfile;
import com.languagelearning.entity.User;
import com.languagelearning.repository.mysql.ExamTestRepository;
import com.languagelearning.repository.mysql.UserExamAttemptRepository;
import com.languagelearning.repository.mysql.UserProfileRepository;
import com.languagelearning.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamProgressService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserExamAttemptRepository attemptRepository;
    private final ExamTestRepository examTestRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    @Transactional(readOnly = true)
    public ExamProgressStatsDto getGlobalStats() {
        long totalUsers    = attemptRepository.countDistinctUsers();
        long totalAttempts = attemptRepository.countAll();

        // TB câu có đáp án chuẩn (Listening + R&W gộp)
        Double avgObjective = attemptRepository.avgObjectiveAccuracyGlobal();

        // TB điểm AI = (tổng writing_score + tổng speaking_score) / (count writing + count speaking)
        Double sumW  = attemptRepository.sumWritingScore();
        Double sumS  = attemptRepository.sumSpeakingScore();
        long   cntW  = attemptRepository.countWithWritingScore();
        long   cntS  = attemptRepository.countWithSpeakingScore();
        Double avgAi = null;
        if (cntW + cntS > 0) {
            double total = (sumW != null ? sumW : 0.0) + (sumS != null ? sumS : 0.0);
            avgAi = total / (cntW + cntS);
        }

        return ExamProgressStatsDto.builder()
                .totalUsers(totalUsers)
                .totalAttempts(totalAttempts)
                .avgObjectiveAccuracy(round2(avgObjective))
                .avgAiScore(round2(avgAi))
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ExamProgressSummaryDto> getSummaryList(int page, int size, String search) {
        // Lấy danh sách user đã thi (distinct userId)
        List<UserExamAttempt> allAttempts = attemptRepository.findAll(Sort.by(Sort.Direction.DESC, "attemptedAt"));

        // Group by userId
        Map<Integer, List<UserExamAttempt>> byUser = allAttempts.stream()
                .collect(Collectors.groupingBy(UserExamAttempt::getUserId));

        // Với mỗi userId xây dựng summary
        List<ExamProgressSummaryDto> summaries = byUser.entrySet().stream()
                .map(e -> {
                    Integer uid = e.getKey();
                    List<UserExamAttempt> attempts = e.getValue();
                    Optional<User> userOpt = userRepository.findById(uid);
                    if (userOpt.isEmpty()) return null;
                    User user = userOpt.get();
                    Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(uid);

                    String fullName  = profileOpt.map(UserProfile::getFullName).orElse(null);
                    String avatarUrl = profileOpt.map(UserProfile::getAvatarUrl).orElse(null);

                    double avgAcc = attempts.stream()
                            .filter(a -> a.getTotalCount() != null && a.getTotalCount() > 0)
                            .mapToDouble(a -> (double) a.getCorrectCount() / a.getTotalCount() * 100)
                            .average().orElse(0);

                    OptionalDouble listening = attempts.stream()
                            .filter(a -> a.getListeningTotal() != null && a.getListeningTotal() > 0)
                            .mapToDouble(a -> (double) a.getListeningCorrect() / a.getListeningTotal() * 100)
                            .average();

                    OptionalDouble rw = attempts.stream()
                            .filter(a -> a.getRwTotal() != null && a.getRwTotal() > 0)
                            .mapToDouble(a -> (double) a.getRwCorrect() / a.getRwTotal() * 100)
                            .average();

                    OptionalDouble wr = attempts.stream()
                            .filter(a -> a.getWritingScore() != null)
                            .mapToInt(UserExamAttempt::getWritingScore)
                            .average();

                    OptionalDouble sp = attempts.stream()
                            .filter(a -> a.getSpeakingScore() != null)
                            .mapToInt(UserExamAttempt::getSpeakingScore)
                            .average();

                    String lastAt = attempts.isEmpty() ? null :
                            attempts.get(0).getAttemptedAt().format(FMT);

                    return ExamProgressSummaryDto.builder()
                            .userId(uid)
                            .email(user.getEmail())
                            .fullName(fullName)
                            .avatarUrl(avatarUrl)
                            .totalAttempts(attempts.size())
                            .avgListeningAccuracy(listening.isPresent() ? round2(listening.getAsDouble()) : null)
                            .avgRwAccuracy(rw.isPresent() ? round2(rw.getAsDouble()) : null)
                            .avgWritingScore(wr.isPresent() ? round2(wr.getAsDouble()) : null)
                            .avgSpeakingScore(sp.isPresent() ? round2(sp.getAsDouble()) : null)
                            .lastAttemptAt(lastAt)
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Sort: nhiều lượt thi nhất lên đầu
        summaries.sort(Comparator.comparingInt(ExamProgressSummaryDto::getTotalAttempts).reversed());

        // Search
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            summaries = summaries.stream()
                    .filter(s -> s.getEmail().toLowerCase().contains(q) ||
                                 (s.getFullName() != null && s.getFullName().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        int total = summaries.size();
        int from  = page * size;
        int to    = Math.min(from + size, total);
        List<ExamProgressSummaryDto> pageItems = from >= total ? List.of() : summaries.subList(from, to);

        return new PageImpl<>(pageItems, PageRequest.of(page, size), total);
    }

    @Transactional(readOnly = true)
    public ExamProgressDetailDto getDetail(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);

        List<UserExamAttempt> attempts = attemptRepository
                .findByUserIdOrderByAttemptedAtDesc(userId);

        // Cache exam test titles
        Map<Integer, ExamTest> testCache = new HashMap<>();

        List<ExamProgressDetailDto.AttemptSummaryDto> attemptDtos = attempts.stream()
                .map(a -> {
                    ExamTest test = testCache.computeIfAbsent(a.getTestId(), id ->
                            examTestRepository.findById(id).orElse(null));

                    String title   = test != null ? buildTestTitle(test) : "Test #" + a.getTestId();
                    String level   = test != null ? test.getCefrLevel().name() : null;
                    Integer number = test != null ? test.getTestNumber() : null;

                    return ExamProgressDetailDto.AttemptSummaryDto.builder()
                            .attemptId(a.getId())
                            .testId(a.getTestId())
                            .testTitle(title)
                            .cefrLevel(level)
                            .testNumber(number)
                            .correctCount(a.getCorrectCount())
                            .totalCount(a.getTotalCount())
                            .listeningCorrect(a.getListeningCorrect())
                            .listeningTotal(a.getListeningTotal())
                            .rwCorrect(a.getRwCorrect())
                            .rwTotal(a.getRwTotal())
                            .writingScore(a.getWritingScore())
                            .speakingScore(a.getSpeakingScore())
                            .attemptedAt(a.getAttemptedAt().format(FMT))
                            .build();
                })
                .collect(Collectors.toList());

        // Tính stats tổng
        OptionalDouble avgL = attempts.stream()
                .filter(a -> a.getListeningTotal() != null && a.getListeningTotal() > 0)
                .mapToDouble(a -> (double) a.getListeningCorrect() / a.getListeningTotal() * 100)
                .average();
        OptionalDouble avgR = attempts.stream()
                .filter(a -> a.getRwTotal() != null && a.getRwTotal() > 0)
                .mapToDouble(a -> (double) a.getRwCorrect() / a.getRwTotal() * 100)
                .average();
        OptionalDouble wr = attempts.stream()
                .filter(a -> a.getWritingScore() != null)
                .mapToInt(UserExamAttempt::getWritingScore).average();
        OptionalDouble sp = attempts.stream()
                .filter(a -> a.getSpeakingScore() != null)
                .mapToInt(UserExamAttempt::getSpeakingScore).average();

        return ExamProgressDetailDto.builder()
                .userId(userId)
                .email(user.getEmail())
                .fullName(profileOpt.map(UserProfile::getFullName).orElse(null))
                .avatarUrl(profileOpt.map(UserProfile::getAvatarUrl).orElse(null))
                .totalAttempts(attempts.size())
                .avgListeningAccuracy(avgL.isPresent() ? round2(avgL.getAsDouble()) : null)
                .avgRwAccuracy(avgR.isPresent() ? round2(avgR.getAsDouble()) : null)
                .avgWritingScore(wr.isPresent() ? round2(wr.getAsDouble()) : null)
                .avgSpeakingScore(sp.isPresent() ? round2(sp.getAsDouble()) : null)
                .attempts(attemptDtos)
                .build();
    }

    private String buildTestTitle(ExamTest test) {
        if (test.getTitle() != null && !test.getTitle().isBlank()) return test.getTitle();
        return test.getCefrLevel().name() + " - Test " + test.getTestNumber();
    }

    private Double round2(Double v) {
        if (v == null) return null;
        return Math.round(v * 100.0) / 100.0;
    }

    private Double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
