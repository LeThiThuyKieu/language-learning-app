package com.languagelearning.repository.mysql;

import com.languagelearning.entity.UserSkipTestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSkipTestAttemptRepository extends JpaRepository<UserSkipTestAttempt, Long> {

    /** Lấy tất cả lần thử của một user cho một level cụ thể, mới nhất trước */
    List<UserSkipTestAttempt> findByUser_IdAndTargetLevel_IdOrderByAttemptedAtDesc(
            Integer userId, Integer targetLevelId);

    /** Đếm số lần thử của user cho một level */
    int countByUser_IdAndTargetLevel_Id(Integer userId, Integer targetLevelId);

    /** Kiểm tra user đã pass level này chưa */
    boolean existsByUser_IdAndTargetLevel_IdAndPassedTrue(Integer userId, Integer targetLevelId);
}
