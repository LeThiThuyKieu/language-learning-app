package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SupportEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportEmailLogRepository extends JpaRepository<SupportEmailLog, Integer> {
    List<SupportEmailLog> findByTicketIdOrderBySentAtDesc(Integer ticketId);
}
