package com.languagelearning.repository.mongo;

import com.languagelearning.document.MatchingExercise;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchingExerciseRepository extends MongoRepository<MatchingExercise, String> {
}


