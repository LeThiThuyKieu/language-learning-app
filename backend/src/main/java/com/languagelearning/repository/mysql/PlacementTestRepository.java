package com.languagelearning.repository.mysql;

import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacementTestRepository extends JpaRepository<PlacementTest, Integer> {
    List<PlacementTest> findByUserOrderByCreatedAtDesc(User user);
}


