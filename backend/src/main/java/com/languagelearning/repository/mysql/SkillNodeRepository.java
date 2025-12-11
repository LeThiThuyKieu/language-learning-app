package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SkillNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillNodeRepository extends JpaRepository<SkillNode, Integer> {
    List<SkillNode> findBySkillTreeIdOrderByOrderIndex(Integer skillTreeId);
}


