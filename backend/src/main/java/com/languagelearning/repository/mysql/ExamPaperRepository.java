package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ExamPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamPaperRepository extends JpaRepository<ExamPaper, Integer> {

    /**
     * Lấy paper theo testId + paperType — không JOIN FETCH lồng nhau để tránh MultipleBagFetchException.
     * Service sẽ fetch parts + questions riêng.
     */
    @Query("SELECT p FROM ExamPaper p WHERE p.examTest.id = :testId AND p.paperType = :paperType")
    Optional<ExamPaper> findByTestIdAndType(
            @Param("testId") Integer testId,
            @Param("paperType") ExamPaper.PaperType paperType);

    /** Lấy tất cả paper của 1 test (dùng khi build correct_answer map) */
    @Query("SELECT p FROM ExamPaper p WHERE p.examTest.id = :testId")
    java.util.List<ExamPaper> findAllByTestId(@Param("testId") Integer testId);
}
