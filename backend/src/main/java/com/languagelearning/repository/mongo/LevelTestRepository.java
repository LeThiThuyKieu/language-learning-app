package com.languagelearning.repository.mongo;

import com.languagelearning.document.LevelTest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LevelTestRepository extends MongoRepository<LevelTest, String> {
}


