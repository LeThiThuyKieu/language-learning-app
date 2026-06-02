package com.languagelearning.repository.mongo;

import com.languagelearning.document.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends MongoRepository<Question, String> {

	List<Question> findByQuestionTextContainingIgnoreCase(String text);

	List<Question> findByOptionsContaining(String option);

	List<Question> findByOptionsAltContaining(String option);

	List<Question> findByCorrectAnswersContaining(String answer);
}


