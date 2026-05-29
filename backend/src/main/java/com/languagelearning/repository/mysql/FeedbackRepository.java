package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Feedback;
import com.languagelearning.entity.SkillTree;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    List<Feedback> findBySkillTree(SkillTree skillTree);
    List<Feedback> findBySkillTreeId(Integer skillTreeId);
    boolean existsByUserAndSkillTreeId(User user, Integer skillTreeId);

    /**
     * Kiểm tra có feedback mới cho tree này kể từ thời điểm lastUpdate không.
     * Dùng để quyết định có cần chạy EMA hay không.
     */
    @Query("SELECT COUNT(f) > 0 FROM Feedback f WHERE f.skillTree.id = :treeId AND f.createdAt > :lastUpdate")
    boolean existsNewFeedbackSince(@Param("treeId") Integer treeId, @Param("lastUpdate") LocalDateTime lastUpdate);
}


