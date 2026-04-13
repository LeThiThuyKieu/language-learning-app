package com.languagelearning.repository.mysql;

import com.languagelearning.entity.PlacementTest;
import com.languagelearning.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlacementTestRepository extends JpaRepository<PlacementTest, Integer> {

    Optional<PlacementTest> findByIdAndUser(Integer id, User user);
}
