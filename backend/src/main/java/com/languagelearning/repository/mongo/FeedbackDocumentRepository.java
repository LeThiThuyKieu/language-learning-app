package com.languagelearning.repository.mongo;

import com.languagelearning.document.Feedback;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackDocumentRepository extends MongoRepository<Feedback, String> {
}


