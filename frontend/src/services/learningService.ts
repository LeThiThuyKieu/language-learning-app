import apiClient from "@/config/api";
import { Lesson, Question, Vocabulary, SkillTree, SkillNode } from "@/types";

export const learningService = {
  getSkillTrees: async (levelId?: number) => {
    const response = await apiClient.get<SkillTree[]>("/learning/skill-trees", {
      params: { levelId },
    });
    return response.data;
  },

  getSkillNodes: async (skillTreeId: number) => {
    const response = await apiClient.get<SkillNode[]>(
      `/learning/skill-trees/${skillTreeId}/nodes`
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
