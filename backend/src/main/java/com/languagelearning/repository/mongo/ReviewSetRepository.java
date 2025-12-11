package com.languagelearning.repository.mongo;

import com.languagelearning.document.ReviewSet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewSetRepository extends MongoRepository<ReviewSet, String> {
}


