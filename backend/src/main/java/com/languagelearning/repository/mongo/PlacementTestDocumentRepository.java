package com.languagelearning.repository.mongo;

import com.languagelearning.document.PlacementTest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacementTestDocumentRepository extends MongoRepository<PlacementTest, String> {
}


