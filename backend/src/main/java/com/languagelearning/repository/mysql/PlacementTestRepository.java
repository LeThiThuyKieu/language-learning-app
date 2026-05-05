package com.languagelearning.repository.mysql;

import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementTestRepository extends JpaRepository<PlacementTest, Integer> {
    Optional<PlacementTest> findByIdAndUser(Integer id, User user);

    List<PlacementTest> findByUser(User user);

    List<PlacementTest> findByUserOrderByCreatedAtDesc(User user);

    /** Lấy bản ghi mới nhất của mỗi user (dùng cho danh sách admin chỗ placement test) */
    @org.springframework.data.jpa.repository.Query(
        "SELECT pt FROM PlacementTest pt WHERE pt.id IN " +
        "(SELECT MAX(pt2.id) FROM PlacementTest pt2 GROUP BY pt2.user) " +
        "ORDER BY pt.createdAt DESC"
    )
    List<PlacementTest> findLatestPerUser();

    long countByUser(User user);
}
