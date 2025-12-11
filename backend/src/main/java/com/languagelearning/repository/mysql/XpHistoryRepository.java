package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.XpHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface XpHistoryRepository extends JpaRepository<XpHistory, Integer> {
    List<XpHistory> findByUserOrderByCreatedAtDesc(User user);
}


