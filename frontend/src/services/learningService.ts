import apiClient from "@/config/api";
import {SkillTreeQuestionsData} from "@/types";

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
  completeNode: async (nodeId: number): Promise<{ unlockedCount: number; knEarned: number }> => {
    const response = await apiClient.post<{ unlockedCount: number; knEarned: number }>(
      `/progress/nodes/${nodeId}/complete`
    );
    return response.data;
  },
};
