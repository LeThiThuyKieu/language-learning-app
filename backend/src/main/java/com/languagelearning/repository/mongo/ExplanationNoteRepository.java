package com.languagelearning.repository.mongo;

import com.languagelearning.document.ExplanationNote;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExplanationNoteRepository extends MongoRepository<ExplanationNote, String> {
}
