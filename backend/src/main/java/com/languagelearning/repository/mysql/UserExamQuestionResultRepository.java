package com.languagelearning.repository.mysql;

import com.languagelearning.entity.UserExamQuestionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserExamQuestionResultRepository extends JpaRepository<UserExamQuestionResult, Long> {

    List<UserExamQuestionResult> findByAttemptId(Long attemptId);
}
