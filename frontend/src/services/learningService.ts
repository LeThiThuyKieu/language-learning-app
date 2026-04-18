import apiClient from "@/config/api";
import {SkillTreeQuestionsData} from "@/types";

export const learningService = {
  /** Bộ câu theo tất cả tree của một level  */
  getLevelQuestions: async (levelId: number) => {
    const response = await apiClient.get<SkillTreeQuestionsData[]>(
      `/learning/levels/${levelId}/questions`
    );
    return response.data;
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

  /** Đánh dấu node hoàn thành, trả về unlockedCount mới */
  completeNode: async (nodeId: number): Promise<number> => {
    const response = await apiClient.post<{ unlockedCount: number }>(
      `/progress/nodes/${nodeId}/complete`
    );
    return response.data.unlockedCount;
  },
};
