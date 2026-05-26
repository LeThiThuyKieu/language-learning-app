package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserSkillTreeProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillTreeProgressRepository extends JpaRepository<UserSkillTreeProgress, Integer> {
    Optional<UserSkillTreeProgress> findByUserAndSkillTreeId(User user, Integer skillTreeId);
    List<UserSkillTreeProgress> findByUser(User user);

    /**
     * Lấy tất cả progress đã done của một tree (dùng để tính difficulty_obs).
     */
    @Query("SELECT p FROM UserSkillTreeProgress p WHERE p.skillTree.id = :treeId AND p.status = 'done'")
    List<UserSkillTreeProgress> findDoneBySkillTreeId(@Param("treeId") Integer treeId);

    /**
     * Kiểm tra có progress done mới cho tree này kể từ thời điểm lastUpdate không.
     * Dùng để quyết định có cần chạy EMA hay không.
     */
    @Query("SELECT COUNT(p) > 0 FROM UserSkillTreeProgress p WHERE p.skillTree.id = :treeId AND p.status = 'done' AND p.updatedAt > :lastUpdate")
    boolean existsNewDoneProgressSince(@Param("treeId") Integer treeId, @Param("lastUpdate") LocalDateTime lastUpdate);
}


