package com.languagelearning.repository.mongo;

import com.languagelearning.document.GeneralRevisionQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneralRevisionQuestionRepository extends MongoRepository<GeneralRevisionQuestion, String> {

    /** Lấy tất cả câu hỏi của một task, sắp xếp theo order_index */
    List<GeneralRevisionQuestion> findByTaskIdOrderByOrderIndexAsc(Integer taskId);

    /** Lấy theo topic + task */
    List<GeneralRevisionQuestion> findByTopicIdAndTaskIdOrderByOrderIndexAsc(Integer topicId, Integer taskId);
}
