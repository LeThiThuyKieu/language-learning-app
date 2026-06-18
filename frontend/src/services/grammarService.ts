import apiClient from "@/config/api";

export interface GrammarTopic {
  id: number;
  slug: string;
  name: string;
  displayOrder: number;
  jsonUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const grammarService = {
  /** Lấy danh sách tất cả grammar topics từ API */
  getGrammarTopics: async (): Promise<GrammarTopic[]> => {
    const response = await apiClient.get<ApiResponse<GrammarTopic[]>>(
      "/public/grammar-topics"
    );
    return response.data.data || [];
  },

  /** Lấy chi tiết một topic từ file JSON */
  getGrammarTopicDetail: async (jsonUrl: string): Promise<any> => {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch grammar detail: ${response.status} ${response.statusText}`);
    }
    try {
      return response.json();
    } catch (e) {
      throw new Error(`Invalid JSON format from ${jsonUrl}`);
    }
  },
};
