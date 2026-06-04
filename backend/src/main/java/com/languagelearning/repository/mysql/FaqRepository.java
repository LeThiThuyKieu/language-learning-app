package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Integer> {

    /** Lấy tất cả FAQ đang ACTIVE, sắp xếp theo display_order tăng dần */
    List<Faq> findByStatusOrderByDisplayOrderAsc(Faq.FaqStatus status);
}
