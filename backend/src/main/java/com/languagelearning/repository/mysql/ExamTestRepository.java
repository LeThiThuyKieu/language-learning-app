package com.languagelearning.repository.mysql;

import com.languagelearning.entity.ExamTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamTestRepository extends JpaRepository<ExamTest, Integer> {

    /**
     * Lấy tất cả test active theo level, kèm papers.
     * DISTINCT để tránh duplicate row do JOIN.
     */
    @Query("SELECT DISTINCT t FROM ExamTest t LEFT JOIN FETCH t.papers WHERE t.cefrLevel = :level AND t.isActive = true")
    List<ExamTest> findActiveByCefrLevel(@Param("level") ExamTest.CefrLevel level);

    /**
     * Lấy tất cả test active, kèm papers.
     */
    @Query("SELECT DISTINCT t FROM ExamTest t LEFT JOIN FETCH t.papers WHERE t.isActive = true")
    List<ExamTest> findAllActive();

    Optional<ExamTest> findByCefrLevelAndTestNumber(ExamTest.CefrLevel cefrLevel, Integer testNumber);

    /** Admin: lấy tất cả tests (kể cả inactive) theo level có phân trang */
    Page<ExamTest> findByCefrLevel(ExamTest.CefrLevel cefrLevel, Pageable pageable);

    /** Đếm theo trạng thái active */
    long countByIsActive(Boolean isActive);
}
