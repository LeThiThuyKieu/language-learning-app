package com.languagelearning.repository.mysql;

import com.languagelearning.entity.GeneralRevisionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GeneralRevisionTaskRepository extends JpaRepository<GeneralRevisionTask, Integer> {
}
