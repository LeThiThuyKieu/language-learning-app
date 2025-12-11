package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserNodeProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNodeProgressRepository extends JpaRepository<UserNodeProgress, Integer> {
    Optional<UserNodeProgress> findByUserAndNodeId(User user, Integer nodeId);
    List<UserNodeProgress> findByUser(User user);
}


