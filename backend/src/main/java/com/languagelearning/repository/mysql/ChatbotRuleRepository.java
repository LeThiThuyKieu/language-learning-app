package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ChatbotRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatbotRuleRepository extends JpaRepository<ChatbotRule, Integer> {

    /**
     * Lấy tất cả rule đang active, sắp xếp theo priority giảm dần.
     * Dùng để load vào bộ nhớ khi match keyword.
     */
    List<ChatbotRule> findByIsActiveTrueOrderByPriorityDesc();

    /**
     * Lấy rule active theo category cụ thể + rule không có category (áp dụng chung),
     * sắp xếp theo priority giảm dần.
     */
    @Query("""
        SELECT r FROM ChatbotRule r
        WHERE r.isActive = true
          AND (r.category IS NULL OR r.category.id = :categoryId)
        ORDER BY r.priority DESC
    """)
    List<ChatbotRule> findActiveByCategoryOrGlobal(@Param("categoryId") Integer categoryId);
}
