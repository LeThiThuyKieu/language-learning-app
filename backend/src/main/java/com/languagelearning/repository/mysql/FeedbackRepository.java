package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Feedback;
import com.languagelearning.entity.SkillTree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Integer> {
    List<Feedback> findBySkillTree(SkillTree skillTree);
    List<Feedback> findBySkillTreeId(Integer skillTreeId);
}


