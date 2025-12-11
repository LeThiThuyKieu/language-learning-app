package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SkillTree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillTreeRepository extends JpaRepository<SkillTree, Integer> {
    List<SkillTree> findByLevelIdOrderByOrderIndex(Integer levelId);
}


