package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ExamPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamPartRepository extends JpaRepository<ExamPart, Integer> {

    /** Lấy tất cả parts của 1 paper kèm questions — 1 JOIN FETCH duy nhất để tránh MultipleBagFetchException */
    @Query("SELECT DISTINCT pt FROM ExamPart pt LEFT JOIN FETCH pt.questions q WHERE pt.paper.id = :paperId ORDER BY pt.orderIndex ASC")
    List<ExamPart> findByPaperIdWithQuestions(@Param("paperId") Integer paperId);

    /** Lấy part kèm paper và examTest — dùng khi cần resolve folder Cloudinary */
    @Query("SELECT pt FROM ExamPart pt JOIN FETCH pt.paper p JOIN FETCH p.examTest WHERE pt.id = :partId")
    Optional<ExamPart> findByIdWithPaperAndTest(@Param("partId") Integer partId);
}
