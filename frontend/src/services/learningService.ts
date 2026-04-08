import apiClient from "@/config/api";
import {
  Lesson,
  Question,
  Vocabulary,
  SkillTreeQuestionsData,
} from "@/types";

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

  getLesson: async (lessonId: string) => {
    const response = await apiClient.get<Lesson>(
      `/learning/lessons/${lessonId}`
    );
    return response.data;
  },

  getQuestions: async (nodeId: number) => {
    const response = await apiClient.get<Question[]>(
      `/learning/nodes/${nodeId}/questions`
    );
    return response.data;
  },

  getVocabularies: async (nodeId: number) => {
    const response = await apiClient.get<Vocabulary[]>(
      `/learning/nodes/${nodeId}/vocabularies`
    );
    return response.data;
  },
};
