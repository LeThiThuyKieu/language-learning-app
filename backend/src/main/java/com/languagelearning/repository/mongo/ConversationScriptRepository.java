package com.languagelearning.repository.mongo;

import com.languagelearning.document.ConversationScript;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConversationScriptRepository extends MongoRepository<ConversationScript, String> {

}


