package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ExamQuestionIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamQuestionIndexRepository extends JpaRepository<ExamQuestionIndex, Long> {

    List<ExamQuestionIndex> findByPartIdOrderByOrderIndexAsc(Integer partId);

    /** Tổng số câu hỏi trên toàn hệ thống = max(question_number_end) của tất cả records */
    @Query("SELECT COALESCE(MAX(q.questionNumberEnd), 0) FROM ExamQuestionIndex q")
    long findMaxQuestionNumberEnd();

    /** Tổng số câu hỏi của 1 paper = max(question_number_end) trong các câu thuộc paper đó */
    @Query("SELECT COALESCE(MAX(q.questionNumberEnd), 0) FROM ExamQuestionIndex q WHERE q.part.paper.id = :paperId")
    int findMaxQuestionNumberEndByPaperId(Integer paperId);
}
