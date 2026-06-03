import apiClient from "@/config/api";
import {SkillTreeQuestionsData} from "@/types";

export interface AttemptItem {
  mongoQuestionId: string;
  userAnswer: string;
  correct: boolean;
}

export interface SubmitAttemptsPayload {
  nodeId: number;
  attempts: AttemptItem[];
  /** Thời gian làm bài (giây) — chỉ dùng cho node REVIEW */
  elapsedSeconds?: number;
  /** true nếu hết giờ */
  timedOut?: boolean;
  /** Outcome: FAST_TRACKER | STEADY | SLOW_PASS | FAIL | CARELESS */
  outcome?: string;
}

export interface BadgeInfo {
  name: string;
  iconUrl: string | null;
}

export interface CompleteNodeResult {
  unlockedCount: number;
  knEarned: number;
  newBadges: BadgeInfo[];
}

// Session cache key pattern: level_questions_{levelId}
function levelQuestionsKey(levelId: number) {
    return `level_questions_${levelId}`;
}

export const learningService = {
  /** Bộ câu theo tất cả tree của một level — cache sessionStorage để tránh gọi lại khi chuyển trang */
  getLevelQuestions: async (levelId: number, forceRefresh = false) => {
    const cacheKey = levelQuestionsKey(levelId);

    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached) as SkillTreeQuestionsData[];
        }
      } catch {
        // ignore parse error, fallback to API
      }
    }

    const response = await apiClient.get<SkillTreeQuestionsData[]>(
      `/learning/levels/${levelId}/questions`
    );
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
    } catch {
      // ignore storage quota error
    }
    return response.data;
  },

  /** Xóa cache level questions (gọi sau khi complete node) */
  invalidateLevelQuestionsCache: (levelId: number) => {
    try {
      sessionStorage.removeItem(levelQuestionsKey(levelId));
    } catch {
      // ignore
    }
  },

  /** Bộ câu theo tree đơn lẻ (VOCAB/LISTENING/… + REVIEW), dữ liệu đã enrich từ Mongo */
  getTreeQuestions: async (skillTreeId: number) => {
    const response = await apiClient.get<SkillTreeQuestionsData>(
      `/learning/trees/${skillTreeId}/questions`
    );
    return response.data;
  },

  /** Lấy số node đã unlock của một tree từ DB */
  getUnlockedCount: async (treeId: number): Promise<number> => {
    const response = await apiClient.get<{ unlockedCount: number }>(
      `/progress/trees/${treeId}/unlocked`
    );
    return response.data.unlockedCount;
  },

  /** Đánh dấu node hoàn thành, trả về unlockedCount và knEarned */
  completeNode: async (nodeId: number, correctCount = 0): Promise<CompleteNodeResult> => {
    const response = await apiClient.post<CompleteNodeResult>(
      `/progress/nodes/${nodeId}/complete?correctCount=${correctCount}`
    );
    return response.data;
  },

  /** Ghi lại kết quả từng câu hỏi + hoàn thành node */
  submitAttempts: async (payload: SubmitAttemptsPayload): Promise<CompleteNodeResult> => {
    const response = await apiClient.post<CompleteNodeResult>(
      `/progress/nodes/submit`,
      payload
    );
    return response.data;
  },

  /** Lấy bộ câu hỏi ngẫu nhiên cho bài test học vượt level — mỗi lần gọi là random mới */
  getSkipTestQuestions: async (levelId: number, sourceLevelIds: number[] = []) => {
    const params = sourceLevelIds.length > 0
      ? "?" + sourceLevelIds.map((id) => `sourceLevelIds=${id}`).join("&")
      : "";
    const response = await apiClient.get<SkillTreeQuestionsData>(
      `/learning/levels/${levelId}/skip-test${params}`
    );
    return response.data;
  },

  /** Lưu kết quả bài skip-test vào DB */
  submitSkipTest: async (
    levelId: number,
    payload: { correctCount: number; totalCount: number; accuracy: number; passed: boolean }
  ): Promise<void> => {
    await apiClient.post(`/learning/levels/${levelId}/skip-test/submit`, payload);
  },

  /** Kiểm tra user đã feedback cho tree này chưa */
  checkFeedback: async (treeId: number): Promise<boolean> => {
    const response = await apiClient.get<{ done: boolean }>(`/feedback/check/${treeId}`);
    return response.data.done;
  },

  /** Gửi feedback rating (1-5) cho một skill tree */
  submitFeedback: async (treeId: number, rating: number): Promise<void> => {
    await apiClient.post("/feedback", { treeId, rating });
  },
};

// Admin helper: lấy chi tiết một câu hỏi theo id (dùng bởi trang admin)
export const getQuestion = async (id: string | number) => {
  const response = await apiClient.get(`/admin/learning/questions/${id}`);
  return response.data as {
    id: number;
    mongoQuestionId: string;
    level: string;
    type: string;
    title: string;
    preview: string;
    // VOCAB
    options?: string[];
    correctAnswer?: string;
    // LISTENING
    blankCount?: number;
    // SPEAKING
    sampleAnswer?: string;
    keywords?: string[];
    // MATCHING
    leftItems?: string[];
    rightItems?: string[];
    correctPairs?: Record<string, string>;
    // Chung
    audio?: string;
    status: string;
    note: string;
  };
};

export interface QuestionPayload {
  levelId: number;
  type: string;
  questionText: string;

  options?: string[];
  correctAnswer?: string;

  blankCount?: number;

  sampleAnswer?: string;
  keywords?: string[];

  audioUrl?: string;
  explanation?: string;
  nodeId?: number;
}

export interface QuestionItem {
  id: number;
  mongoQuestionId: string;

  levelId?: number;
  questionType?: string;
  questionText?: string;

  correctAnswer?: string;
  options?: string[];

  audioUrl?: string;
  phonetic?: string;

  status?: string;
}

export const adminApi = {
  listQuestions: async (params: { page?: number; size?: number; q?: string; type?: string; levelId?: number }) => {
    const response = await apiClient.get(`/admin/learning/questions`, { params });
    return response.data as {
      items: QuestionItem[];
      total: number;
      page: number;
      size: number;
      totalPages?: number;
    };
  },

  createQuestion: async (payload: QuestionPayload) => {
    const response = await apiClient.post(`/admin/learning/questions`, payload);
    return response.data as { id: number; mongoQuestionId: string };
  },

  updateQuestion: async (
      id: number | string,
      payload: Partial<QuestionPayload>
  ) => {
    const response = await apiClient.put(`/admin/learning/questions/${id}`, payload);
    return response.data as { id: number };
  },

  bulkAction: async (payload: { action: string; ids: number[]; targetLevelId?: number }) => {
    const response = await apiClient.post(`/admin/learning/bulk`, payload);
    return response.data;
  }
};

// Admin metadata
export const adminMeta = {
  getTypes: async () => {
    const res = await apiClient.get<string[]>(`/admin/learning/types`);
    return res.data;
  },
  getLevels: async () => {
    const res = await apiClient.get<{ id: number; levelName: string; cefrCode?: string }[]>(`/admin/learning/levels`);
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get<{ vocab: number; listening: number; speaking: number; matching: number }>(
      `/admin/learning/stats`
    );
    return res.data;
  },
};
