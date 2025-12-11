package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserSkillTreeProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillTreeProgressRepository extends JpaRepository<UserSkillTreeProgress, Integer> {
    Optional<UserSkillTreeProgress> findByUserAndSkillTreeId(User user, Integer skillTreeId);
    List<UserSkillTreeProgress> findByUser(User user);
}


