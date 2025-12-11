package com.languagelearning.repository.mongo;

import com.languagelearning.document.SkillNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillNodeDocumentRepository extends MongoRepository<SkillNode, String> {
}


