package com.languagelearning.repository.mysql;

import com.languagelearning.entity.User;
import com.languagelearning.entity.UserGeneralRevisionTopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserGeneralRevisionTopicProgressRepository
        extends JpaRepository<UserGeneralRevisionTopicProgress, Integer> {

    Optional<UserGeneralRevisionTopicProgress> findByUserAndTopicId(User user, Integer topicId);

    List<UserGeneralRevisionTopicProgress> findByUser(User user);
}
