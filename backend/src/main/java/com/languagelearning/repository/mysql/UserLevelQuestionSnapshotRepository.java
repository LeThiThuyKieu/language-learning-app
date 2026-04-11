package com.languagelearning.repository.mysql;

import com.languagelearning.entity.UserLevelQuestionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserLevelQuestionSnapshotRepository extends JpaRepository<UserLevelQuestionSnapshot, Integer> {

    Optional<UserLevelQuestionSnapshot> findByUserIdAndLevelId(Integer userId, Integer levelId);
}
