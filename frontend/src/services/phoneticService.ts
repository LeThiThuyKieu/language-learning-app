import apiClient from "@/config/api";

export interface PhoneticItem {
  id: number;
  symbol: string;
  type: "VOWEL" | "CONSONANT";
  exampleWord: string;
  audioUrl: string | null;
  wordAudioUrl: string | null;
  displayOrder: number;
}

export interface PhoneticsData {
  vowels: PhoneticItem[];
  consonants: PhoneticItem[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const phoneticService = {
  /** Lấy nguyên âm + phụ âm từ API */
  getPhonetics: async (): Promise<PhoneticsData> => {
    const response = await apiClient.get<ApiResponse<PhoneticsData>>("/public/phonetics");
    return response.data.data;
  },
};
