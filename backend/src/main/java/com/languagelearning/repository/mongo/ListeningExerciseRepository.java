package com.languagelearning.repository.mongo;

import com.languagelearning.document.ListeningExercise;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ListeningExerciseRepository extends MongoRepository<ListeningExercise, String> {
}


