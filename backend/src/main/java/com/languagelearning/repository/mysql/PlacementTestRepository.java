package com.languagelearning.repository.mysql;

import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementTestRepository extends JpaRepository<PlacementTest, Integer> {

    Optional<PlacementTest> findByIdAndUser(Integer id, User user);

    List<PlacementTest> findByUser(User user);

    /**
     * Lịch sử tất cả lần làm của một user.
     * JOIN FETCH cả detectedLevel lẫn user để tránh lazy-load null.
     */
    @Query("SELECT pt FROM PlacementTest pt " +
           "LEFT JOIN FETCH pt.detectedLevel " +
           "LEFT JOIN FETCH pt.user u " +
           "WHERE u.id = :userId " +
           "ORDER BY pt.id DESC")
    List<PlacementTest> findByUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    /**
     * Lấy bản ghi mới nhất (ID lớn nhất) của mỗi user.
     * JOIN FETCH cả detectedLevel lẫn user để tránh lazy-load null.
     */
    @Query("SELECT pt FROM PlacementTest pt " +
           "LEFT JOIN FETCH pt.detectedLevel " +
           "LEFT JOIN FETCH pt.user " +
           "WHERE pt.id IN (SELECT MAX(pt2.id) FROM PlacementTest pt2 GROUP BY pt2.user) " +
           "ORDER BY pt.id DESC")
    List<PlacementTest> findLatestPerUser();

    @Query("SELECT COUNT(DISTINCT pt.id) FROM PlacementTest pt WHERE pt.user.id = :userId")
    long countDistinctByUserId(@Param("userId") Integer userId);
}
