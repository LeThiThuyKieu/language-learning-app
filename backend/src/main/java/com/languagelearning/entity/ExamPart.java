package com.languagelearning.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exam_part")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    private ExamPaper paper;

    @Column(name = "part_number", nullable = false)
    private Integer partNumber;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @OneToMany(mappedBy = "part", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @ToString.Exclude
    @JsonIgnore
    private List<ExamQuestionIndex> questions = new ArrayList<>();
}
