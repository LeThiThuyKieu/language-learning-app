package com.languagelearning.repository.mongo;

import com.languagelearning.document.MediaFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaFileRepository extends MongoRepository<MediaFile, String> {
}


