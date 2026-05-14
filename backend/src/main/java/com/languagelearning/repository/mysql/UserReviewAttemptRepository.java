package com.languagelearning.repository.mysql;

import com.languagelearning.entity.UserReviewAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserReviewAttemptRepository extends JpaRepository<UserReviewAttempt, Long> {
}
