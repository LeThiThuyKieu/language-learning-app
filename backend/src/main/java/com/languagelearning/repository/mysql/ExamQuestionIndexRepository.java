package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ExamQuestionIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamQuestionIndexRepository extends JpaRepository<ExamQuestionIndex, Long> {
}
