export type PlacementLevelBand = 1 | 2 | 3;

export type PlacementSkillKey = "vocab" | "listening" | "speaking" | "matching" ;

export type PlacementStep =
  | {
      kind: "vocab";
      id: string;
      level: PlacementLevelBand;
      questionId: number;
      prompt: string;
      options: string[];
      /** Chỉ có khi mock local — API không gửi đáp án */
      correctIndex?: number;
    }
  | {
      kind: "matching";
      id: string;
      level: PlacementLevelBand;
      pairs: { leftId: string; rightId: string; left: string; right: string }[];
    }
  | {
      kind: "listening";
      id: string;
      level: PlacementLevelBand;
      questionId: number;
      title: string;
      audioUrl: string;
      /** Câu có chỗ trống, đánh dấu bằng "___" */
      textWithBlanks: string;
      /** Chỉ mock: đáp án đúng để gợi ý */
      blankAnswers?: string[];
    }
  | {
      kind: "speaking";
      id: string;
      level: PlacementLevelBand;
      instruction: string;
      /** Mỗi dòng: questionId + lineIndex + text mẫu */
      lines: { questionId: number; lineIndex: number; text: string }[];
    };

export const PLACEMENT_MAX_TOTAL = 160;
export const SKILL_MAX = {
  vocab: 40,
  matching: 40,
  listening: 40,
  speaking: 40,
} as const;

/** Tổng cả bài (3 level): 15 vocab, 3 listening, 3 speaking, 15 cặp matching */
export const PLACEMENT_SECTION_COUNTS = {
  vocab: 15,
  listening: 3,
  speaking: 3,
  matchingPairs: 15,
} as const;

export function levelBandEnglish(level: PlacementLevelBand): string {
  if (level === 1) return "Beginner";
  if (level === 2) return "Intermediate";
  return "Advanced";
}

export type PlacementBandResult = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type PlacementTestResultPayload = {
  userName: string;
  totalScore: number;
  maxScore: typeof PLACEMENT_MAX_TOTAL;
  band: PlacementBandResult;
  bandLabelVi: string;
  cefrLabel: string;
  skills: Record<
    PlacementSkillKey,
    {
      score: number;
      max: number;
    }
  >;
  weakest: PlacementSkillKey;
  analysisVi: string;
};
