package com.languagelearning.repository.mongo;

import com.languagelearning.document.GeneralRevisionQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneralRevisionQuestionRepository extends MongoRepository<GeneralRevisionQuestion, String> {

    /**
     * Lấy tất cả câu hỏi theo question_type (nếu cần filter)
     */
    List<GeneralRevisionQuestion> findByQuestionType(String questionType);

    /**
     * Lấy theo question_type và sắp xếp theo order_index
     */
    List<GeneralRevisionQuestion> findByQuestionTypeOrderByOrderIndexAsc(String questionType);
}
