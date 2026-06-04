package com.languagelearning.repository.mysql;

import com.languagelearning.entity.GeneralRevisionTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneralRevisionTopicRepository extends JpaRepository<GeneralRevisionTopic, Integer> {

    /** Lấy tất cả topic đang active, kèm tasks, sắp xếp theo order_index */
    @Query("SELECT DISTINCT t FROM GeneralRevisionTopic t LEFT JOIN FETCH t.tasks WHERE t.isActive = true ORDER BY t.orderIndex ASC")
    List<GeneralRevisionTopic> findAllActiveWithTasks();
}
