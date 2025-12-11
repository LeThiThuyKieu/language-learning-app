package com.languagelearning.repository.mongo;

import com.languagelearning.document.SpeakingExercise;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpeakingExerciseRepository extends MongoRepository<SpeakingExercise, String> {
}


