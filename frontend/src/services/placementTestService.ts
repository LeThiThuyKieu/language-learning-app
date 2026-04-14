import apiClient from "@/config/api";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrap<T>(r: { data: ApiResponse<T> }): T {
  return r.data.data;
}

export interface PlacementStartData {
  testId: number;
}

export interface PlacementVocabItem {
  questionId: number;
  mongoQuestionId: string;
  questionText: string;
  options: string[];
}

export interface PlacementMatchingCard {
  cardId: string;
  text: string;
}

export interface PlacementMatchingData {
  level: number;
  leftColumn: PlacementMatchingCard[];
  rightColumn: PlacementMatchingCard[];
}

export interface PlacementListeningData {
  level: number;
  questionId: number;
  mongoQuestionId: string;
  audioUrl: string | null;
  textWithBlanks: string;
  blankCount: number;
}

export interface PlacementSpeakingLine {
  questionId: number;
  mongoQuestionId: string;
  lineIndex: number;
  line: string;
}

export interface PlacementSpeakingData {
  level: number;
  audioUrl: string | null;
  lines: PlacementSpeakingLine[];
}

export interface PlacementSubmitPayload {
  testId: number;
  level: number;
  vocabAnswers: { questionId: number; selectedOptionIndex: number }[];
  matchingAnswers: { leftCardId: string; rightCardId: string }[];
  listeningAnswers: { questionId: number; gapAnswers: string[] }[];
  speakingAnswers: { questionId: number; lineIndex?: number | null; typedText: string }[];
}

export interface PlacementSubmitData {
  testId: number;
  status: string;
  levelAverageRatio: number;
  message: string;
}

export interface PlacementResultData {
  testId: number;
  totalScore: number;
  band: string;
  bandLabelVi: string;
  detectedLevelId: number;
  detectedLevelName: string;
  skillScores: Record<string, number>;
}

export const placementTestService = {
  start: async (): Promise<PlacementStartData> => {
    const r = await apiClient.post<ApiResponse<PlacementStartData>>("/placement-test/start");
    return unwrap(r);
  },

  getVocab: async (testId: number, level: number): Promise<PlacementVocabItem[]> => {
    const r = await apiClient.get<ApiResponse<PlacementVocabItem[]>>("/placement-test/vocab", {
      params: { testId, level },
    });
    return unwrap(r);
  },

  getMatching: async (testId: number, level: number): Promise<PlacementMatchingData> => {
    const r = await apiClient.get<ApiResponse<PlacementMatchingData>>("/placement-test/matching", {
      params: { testId, level },
    });
    return unwrap(r);
  },

  getListening: async (testId: number, level: number): Promise<PlacementListeningData> => {
    const r = await apiClient.get<ApiResponse<PlacementListeningData>>("/placement-test/listening", {
      params: { testId, level },
    });
    return unwrap(r);
  },

  getSpeaking: async (testId: number, level: number): Promise<PlacementSpeakingData> => {
    const r = await apiClient.get<ApiResponse<PlacementSpeakingData>>("/placement-test/speaking", {
      params: { testId, level },
    });
    return unwrap(r);
  },

  submitSection: async (body: PlacementSubmitPayload): Promise<PlacementSubmitData> => {
    const r = await apiClient.post<ApiResponse<PlacementSubmitData>>("/placement-test/submit-section", body);
    return unwrap(r);
  },

  getResult: async (testId: number): Promise<PlacementResultData> => {
    const r = await apiClient.get<ApiResponse<PlacementResultData>>(`/placement-test/result/${testId}`);
    return unwrap(r);
  },
};
