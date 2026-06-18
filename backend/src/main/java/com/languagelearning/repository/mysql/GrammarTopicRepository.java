package com.languagelearning.repository.mysql;

import com.languagelearning.entity.GrammarTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrammarTopicRepository extends JpaRepository<GrammarTopic, Long> {
    /** Lấy tất cả grammar topics theo thứ tự hiển thị */
    List<GrammarTopic> findAllByOrderByDisplayOrderAsc();
}
