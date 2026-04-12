export type PlacementLevelBand = 1 | 2 | 3;

export type PlacementSkillKey = "vocab" | "listening" | "speaking" | "matching" ;

export type PlacementStep =
  | {
      kind: "vocab";
      id: string;
      level: PlacementLevelBand;
      prompt: string;
      options: string[];
      correctIndex: number;
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
      title: string;
      audioUrl: string;
      /** Câu có chỗ trống, đánh dấu bằng "___" */
      textWithBlanks: string;
      /** Đáp án theo thứ tự chỗ trống */
      blankAnswers: string[];
    }
  | {
      kind: "speaking";
      id: string;
      level: PlacementLevelBand;
      instruction: string;
      lines: string[];
    };

export const PLACEMENT_MAX_TOTAL = 160;
export const SKILL_MAX = {
  vocab: 40,
  matching: 40,
  listening: 40,
  speaking: 40,
} as const;

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
