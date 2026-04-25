package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Integer>, JpaSpecificationExecutor<SupportTicket> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
