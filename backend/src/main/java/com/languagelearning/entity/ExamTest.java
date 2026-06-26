package com.languagelearning.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exam_test")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_level", nullable = false, length = 10)
    private CefrLevel cefrLevel;

    @Column(name = "test_number", nullable = false)
    private Integer testNumber;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "examTest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @ToString.Exclude
    @JsonIgnore
    private List<ExamPaper> papers = new ArrayList<>();

    public enum CefrLevel {
        A2, B1, B2, C1, C2
    }
}
