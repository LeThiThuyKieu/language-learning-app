import apiClient from "@/config/api";

// Types (mirror backend DTOs)

export interface ExamPaperSummaryDto {
  paperType: "LISTENING" | "READING_WRITING" | "SPEAKING";
  label: string;
  durationMinutes: number;
  durationLabel: string;
}

export interface ExamTestDto {
  id: number;
  cefrLevel: string;
  testNumber: number;
  title: string;
  description: string;
  papers: ExamPaperSummaryDto[];
}

export interface ExamOption {
  id: string;          // "A" | "B" | "C"
  text: string | null;
  image_url: string | null;
}

export interface ExamLeftItem {
  question_number: number;
  label: string;
}

export interface ExamRightItem {
  id: string;
  label: string;
}

export interface ExamStoryImage {
  order: number;
  image_url: string | null;
  alt: string;
}

export interface SourceText {
  title: string;
  text: string;
}

export interface ExamQuestionDto {
  id: number;
  mongoDocId: string;
  questionType:
    | "MULTIPLE_CHOICE"
    | "FILL_IN_FORM"
    | "MATCHING"
    | "FILL_IN_TEXT"
    | "SHORT_WRITE"
    | "SPEAKING_TASK";
  questionNumberStart: number;
  questionNumberEnd: number;
  /** null khi đang làm bài; có giá trị khi xem lại bài đã nộp */
  correctAnswer: string | null;

  // chung
  instruction: string | null;

  // MULTIPLE_CHOICE
  questionNumber?: number;
  text?: string;
  options?: ExamOption[];
  passageImageUrl?: string | null;  // R&W — ảnh notice/passage
  passageText?: string | null;      // R&W Part 2+ — đoạn văn dài (lưu ở câu đầu part)
  blanksOptions?: Array<{ number: number; options: string[] }> | null; // FILL_IN_FORM paragraph dropdown

  // FILL_IN_FORM
  formTitle?: string;
  formContent?: string;  // plain text, \n + ____ marker

  // MATCHING
  instructionDetail?: string;
  leftItems?: ExamLeftItem[];
  rightItems?: ExamRightItem[];

  // FILL_IN_TEXT
  sentence?: string;

  // SHORT_WRITE
  writeType?: "EMAIL" | "STORY";
  minWords?: number;
  maxWords?: number | null;
  promptText?: string;
  bulletPoints?: string[];
  storyImages?: ExamStoryImage[];
  source_texts?: SourceText[] | null;

  // SPEAKING_TASK
  partTitle?: string;
  prompt?: string;
  prepTimeSec?: number;
  speakTimeSec?: number;
  imageUrl?: string | null;
  /** Cambridge format: Part → Phase → Question */
  speakingParts?: SpeakingPart[];
}

export interface SpeakingPart {
  partNumber: number;
  partTitle: string;
  duration: number; // phút
  phases: SpeakingPhase[];
}

export interface SpeakingPhase {
  phaseNumber: number;
  interlocutorIntro: string | null;
  questions: SpeakingQuestion[];
  backupPrompts: string[];
  extendedResponse: { prompt: string; backupQuestions: string[] } | null;
  mediaUrl: string | null;       // 1 ảnh (backward compat)
  mediaUrls: string[] | null;    // nhiều ảnh (B2 Part 2)
  allowedTime: number | null;
}

export interface SpeakingQuestion {
  candidateTarget: "A" | "B" | "both";
  questionText: string;
  type: "direct" | "follow-up" | "optional";
  backupQuestions: string[];
}

export interface ExamPartDto {
  partNumber: number;
  questions: ExamQuestionDto[];
}

export interface ExamPaperDto {
  paperId: number;
  paperType: "LISTENING" | "READING_WRITING" | "SPEAKING";
  durationMinutes: number;
  audioUrl: string | null;
  parts: ExamPartDto[];
}

// Service

export const examService = {
  /**
   * GET /api/exam/tests?level=A2
   * Lấy danh sách bài thi của 1 level.
   */
  getTestsByLevel: async (level: string): Promise<ExamTestDto[]> => {
    const res = await apiClient.get<ExamTestDto[]>("/exam/tests", {
      params: { level: level.toUpperCase() },
    });
    return res.data;
  },

  /**
   * GET /api/exam/tests
   * Lấy tất cả bài thi (không filter level).
   */
  getAllTests: async (): Promise<ExamTestDto[]> => {
    const res = await apiClient.get<ExamTestDto[]>("/exam/tests");
    return res.data;
  },

  /**
   * GET /api/exam/tests/{testId}/papers/{paperType}
   * Lấy nội dung đầy đủ 1 paper để làm bài.
   */
  getPaper: async (
    testId: number,
    paperType: "LISTENING" | "READING_WRITING" | "SPEAKING"
  ): Promise<ExamPaperDto> => {
    const res = await apiClient.get<ExamPaperDto>(
      `/exam/tests/${testId}/papers/${paperType}`
    );
    return res.data;
  },
};
