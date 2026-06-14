package com.languagelearning.repository.mysql;

import com.languagelearning.entity.GeneralRevisionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneralRevisionTaskRepository extends JpaRepository<GeneralRevisionTask, Integer> {

    List<GeneralRevisionTask> findByTopicIdOrderByTaskIndexAsc(Integer topicId);

    /** Đếm số câu hỏi của mỗi task theo topic — trả về [taskId, count] */
    @Query("SELECT q.taskId, COUNT(q) FROM GeneralRevisionQuestionIndex q WHERE q.topicId = :topicId GROUP BY q.taskId")
    List<Object[]> countQuestionsByTopicGroupByTask(@Param("topicId") Integer topicId);
}
