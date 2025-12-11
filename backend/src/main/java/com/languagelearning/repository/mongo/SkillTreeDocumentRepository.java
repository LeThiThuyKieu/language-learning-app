package com.languagelearning.repository.mongo;

import com.languagelearning.document.SkillTree;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillTreeDocumentRepository extends MongoRepository<SkillTree, String> {
}


