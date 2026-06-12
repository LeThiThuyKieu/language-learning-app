package com.languagelearning.repository.mysql;

import com.languagelearning.entity.Phonetic;
import com.languagelearning.entity.Phonetic.PhoneticType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhoneticRepository extends JpaRepository<Phonetic, Integer> {
    /** Lấy tất cả âm theo loại, sắp xếp theo display_order */
    List<Phonetic> findByTypeOrderByDisplayOrderAsc(PhoneticType type);
}
