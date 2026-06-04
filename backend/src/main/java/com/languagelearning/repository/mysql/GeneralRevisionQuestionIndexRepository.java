package com.languagelearning.repository.mysql;

import com.languagelearning.entity.GeneralRevisionQuestionIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneralRevisionQuestionIndexRepository extends JpaRepository<GeneralRevisionQuestionIndex, Long> {

    /**
     * Tìm theo mongo_question_id (dùng để lấy correct_answer khi chấm bài)
     */
    Optional<GeneralRevisionQuestionIndex> findByMongoQuestionId(String mongoQuestionId);

    /**
     * Lấy tất cả câu hỏi của một task (dùng khi cần batch load)
     */
    List<GeneralRevisionQuestionIndex> findByTaskIdOrderById(Integer taskId);

    /**
     * Lấy tất cả câu hỏi của một topic
     */
    List<GeneralRevisionQuestionIndex> findByTopicIdOrderById(Integer topicId);

    /**
     * Lấy theo topic + task
     */
    List<GeneralRevisionQuestionIndex> findByTopicIdAndTaskIdOrderById(Integer topicId, Integer taskId);

    /**
     * Đếm số câu hỏi theo task
     */
    @Query("SELECT COUNT(q) FROM GeneralRevisionQuestionIndex q WHERE q.taskId = :taskId")
    long countByTaskId(@Param("taskId") Integer taskId);
}
