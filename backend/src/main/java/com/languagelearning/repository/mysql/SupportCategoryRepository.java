package com.languagelearning.repository.mysql;

import com.languagelearning.entity.SupportCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportCategoryRepository extends JpaRepository<SupportCategory, Integer> {
}
