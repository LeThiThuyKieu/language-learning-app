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

// Grading DTOs
export interface WritingGradeRequest {
  mongoDocId: string;
  writeType?: "EMAIL" | "STORY";
  promptText?: string;
  bulletPoints?: string[];
  minWords?: number;
  maxWords?: number | null;
  userAnswer: string;
  correctAnswer?: string | null;
}

export interface SpeakingGradeRequest {
  mongoDocId: string;
  partNumber?: number;
  /** Part title for LLM context */
  partContext?: string;
  /** Duration in minutes */
  partDurationMinutes?: number;
  /** Full transcript of the entire Part */
  transcript: string;
  /** All question texts in this Part (for coverage evaluation) */
  allQuestionsText?: string[];
  totalQuestions?: number;
}

export interface GradeBreakdown {
  // Writing
  task_completion?: number;
  content?: number;
  grammar?: number;
  vocabulary?: number;
  // Speaking
  relevance?: number;
  fluency?: number;
}

export interface GradeResponse {
  /** 0–100 */
  score: number;
  /** Nhận xét tiếng Việt */
  feedback: string;
  /** JSON string của breakdown object (nullable) */
  breakdown: string | null;
  /** Gợi ý cải thiện (Writing only, nullable) */
  suggestion: string | null;
  /** Số từ (Writing only, null với Speaking) */
  wordCount: number | null;
}

// Exam Attempt DTOs
export interface SaveExamAttemptQuestionResult {
  mongoDocId:    string;
  questionType:  string;
  /** LISTENING | READING_WRITING | SPEAKING — dùng để tính per-paper counts */
  paperType?:    string;
  userAnswer?:   string;
  isCorrect?:    boolean | null;
  llmScore?:     number | null;
  llmFeedback?:  string | null;
  llmBreakdown?: string | null;
  llmSuggestion?: string | null;
  wordCount?:    number | null;
  transcript?:   string | null;
}

export interface SaveExamAttemptRequest {
  testId:          number;
  writingScore?:   number | null;
  speakingScore?:  number | null;
  questionResults: SaveExamAttemptQuestionResult[];
}

export interface ExamAttemptSummaryDto {
  id:            number;
  testId:        number;
  testTitle:     string;
  writingScore:  number | null;
  speakingScore: number | null;
  correctCount:  number;
  totalCount:    number;
  /** Listening: số câu đúng */
  listeningCorrect: number;
  /** Listening: tổng câu có đáp án */
  listeningTotal:   number;
  /** Reading & Writing: số câu đúng */
  rwCorrect: number;
  /** Reading & Writing: tổng câu có đáp án */
  rwTotal:   number;
  attemptedAt:   string; // ISO datetime
}

export interface QuestionResultDetailDto {
  mongoDocId:          string;
  questionType:        string;
  /** LISTENING | READING_WRITING | SPEAKING */
  paperType?:          string | null;
  /** Part number in paper (1, 2, 3...) */
  partNumber?:         number | null;
  instruction?:        string | null;
  questionNumber?:     number | null;
  text?:               string | null;
  sentence?:           string | null;
  formContent?:        string | null;
  promptText?:         string | null;
  partTitle?:          string | null;
  /** FILL_IN_FORM: [{number: int, options: string[]}] — dùng để map A/B/C → text */
  blanksOptions?:      Array<{ number: number; options: string[] }> | null;
  /** MULTIPLE_CHOICE: [{id, text, image_url}] */
  options?:            Array<{ id?: string; text?: string; image_url?: string }> | null;
  /** R&W passage/notice image */
  passageImageUrl?:    string | null;
  /** MATCHING */
  leftItems?:          Array<{ question_number?: number; label?: string }> | null;
  rightItems?:         Array<{ id?: string; label?: string }> | null;
  /** SHORT_WRITE */
  bulletPoints?:       string[] | null;
  storyImages?:        Array<{ order?: number; image_url?: string; alt?: string }> | null;
  /** SPEAKING_TASK */
  imageUrl?:           string | null;
  userAnswer?:         string | null;
  isCorrect?:          boolean | null;
  correctAnswer?:      string | null;
  llmScore?:           number | null;
  llmFeedback?:        string | null;
  llmBreakdown?:       string | null;
  llmSuggestion?:      string | null;
  wordCount?:          number | null;
  transcript?:         string | null;
  questionNumberStart?: number | null;
  questionNumberEnd?:   number | null;
}

export interface ExamAttemptDetailDto {
  id:              number;
  testId:          number;
  testTitle:       string;
  writingScore:    number | null;
  speakingScore:   number | null;
  correctCount:    number;
  totalCount:      number;
  attemptedAt:     string;
  questionResults: QuestionResultDetailDto[];
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

  /**
   * POST /api/exam/grade/writing
   * Chấm bài SHORT_WRITE bằng LLM. Trả về score 0–100 + feedback.
   */
  gradeWriting: async (req: WritingGradeRequest): Promise<GradeResponse> => {
    const res = await apiClient.post<GradeResponse>("/exam/grade/writing", req);
    return res.data;
  },

  /**
   * POST /api/exam/grade/speaking
   * Chấm Speaking dựa trên transcript từ Web Speech API.
   */
  gradeSpeaking: async (req: SpeakingGradeRequest): Promise<GradeResponse> => {
    const res = await apiClient.post<GradeResponse>("/exam/grade/speaking", req);
    return res.data;
  },

  // Exam Attempt (lưu & xem lại lịch sử)
  saveAttempt: async (req: SaveExamAttemptRequest): Promise<ExamAttemptSummaryDto> => {
    const res = await apiClient.post<ExamAttemptSummaryDto>("/exam/attempts", req);
    return res.data;
  },

  getMyAttempts: async (): Promise<ExamAttemptSummaryDto[]> => {
    const res = await apiClient.get<ExamAttemptSummaryDto[]>("/exam/attempts");
    return res.data;
  },

  getMyAttemptsForTest: async (testId: number): Promise<ExamAttemptSummaryDto[]> => {
    const res = await apiClient.get<ExamAttemptSummaryDto[]>(`/exam/attempts/test/${testId}`);
    return res.data;
  },

  getAttemptDetail: async (attemptId: number): Promise<ExamAttemptDetailDto> => {
    const res = await apiClient.get<ExamAttemptDetailDto>(`/exam/attempts/${attemptId}`);
    return res.data;
  },
};
