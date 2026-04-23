package com.languagelearning.repository.mongo;

import com.languagelearning.document.VocabularyCache;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyCacheRepository extends MongoRepository<VocabularyCache, String> {

    Optional<VocabularyCache> findByWord(String word);

    /** Lấy nhiều từ cùng lúc — dùng khi cache miss Redis */
    List<VocabularyCache> findByWordIn(List<String> words);
}
