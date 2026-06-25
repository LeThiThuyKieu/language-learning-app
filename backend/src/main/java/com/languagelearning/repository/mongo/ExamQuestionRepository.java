package com.languagelearning.repository.mongo;

import com.languagelearning.document.ExamQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionRepository extends MongoRepository<ExamQuestion, String> {

    List<ExamQuestion> findBySection(String section);

    List<ExamQuestion> findByQuestionType(String questionType);
}
