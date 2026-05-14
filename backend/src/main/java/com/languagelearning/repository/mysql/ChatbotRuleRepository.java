package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ChatbotRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatbotRuleRepository extends JpaRepository<ChatbotRule, Integer> {

    /** Tất cả rule active, sắp xếp priority giảm dần */
    List<ChatbotRule> findByIsActiveTrueOrderByPriorityDesc();

    /** Rule active thuộc category cụ thể (không bao gồm global) */
    @Query("""
        SELECT r FROM ChatbotRule r
        WHERE r.isActive = true
          AND r.category.id = :categoryId
        ORDER BY r.priority DESC
    """)
    List<ChatbotRule> findActiveByCategory(@Param("categoryId") Integer categoryId);

    /** Rule active general (category IS NULL) */
    @Query("""
        SELECT r FROM ChatbotRule r
        WHERE r.isActive = true
          AND r.category IS NULL
        ORDER BY r.priority DESC
    """)
    List<ChatbotRule> findActiveGeneral();

    /** Rule active thuộc các category khác (không phải categoryId và không phải global) */
    @Query("""
        SELECT r FROM ChatbotRule r
        WHERE r.isActive = true
          AND r.category IS NOT NULL
          AND r.category.id <> :categoryId
        ORDER BY r.priority DESC
    """)
    List<ChatbotRule> findActiveByOtherCategories(@Param("categoryId") Integer categoryId);
}
