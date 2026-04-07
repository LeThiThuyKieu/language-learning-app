package com.languagelearning.repository.mysql;

import com.languagelearning.entity.QuestionIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionIndexRepository extends JpaRepository<QuestionIndex, Long> {

    @Query(
            value = "SELECT * FROM questions WHERE level_id = :levelId AND node_id = :nodeId ORDER BY RAND() LIMIT :limit",
            nativeQuery = true
    )
    List<QuestionIndex> findRandomByLevelAndNode(
            @Param("levelId") Integer levelId,
            @Param("nodeId") Integer nodeId,
            @Param("limit") int limit
    );

    @Query(
            value = "SELECT * FROM questions WHERE level_id = :levelId AND question_type = :type ORDER BY RAND() LIMIT :limit",
            nativeQuery = true
    )
    List<QuestionIndex> findRandomByLevelAndType(
            @Param("levelId") Integer levelId,
            @Param("type") String type,
            @Param("limit") int limit
    );

    @Query(
            value = "SELECT * FROM questions WHERE level_id = :levelId AND question_type = :type AND id NOT IN (:ids) ORDER BY RAND() LIMIT :limit",
            nativeQuery = true
    )
    List<QuestionIndex> findRandomByLevelAndTypeExcludingIds(
            @Param("levelId") Integer levelId,
            @Param("type") String type,
            @Param("ids") List<Long> ids,
            @Param("limit") int limit
    );
}
