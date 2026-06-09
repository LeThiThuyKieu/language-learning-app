import apiClient from "@/config/api";

// Types (mirror backend DTOs)

export interface RevisionTaskDto {
  taskId: number;
  taskIndex: number;
  taskLabel: string;
  questionType: string;
  description: string;
  attemptCount: number;
  completed: boolean;
}

export interface RevisionTopicDto {
  topicId: number;
  title: string;
  description: string;
  orderIndex: number;
  tasks: RevisionTaskDto[];
  completedTasks: number;
}

export interface RevisionQuestionDto {
  questionId: string;
  topicId: number;
  taskId: number;
  questionType: string;
  orderIndex: number;
  // VOCAB_IMAGE
  imageUrl?: string;
  correctAnswer?: string;
  // WRITING dạng danh sách định nghĩa
  questionText?: string;
  // MATCHING
  pairs?: { left: string; right: string }[];
  // SPEAKING / WRITING
  categories?: {
    label: string;
    slots: number;
  }[];
  images?: {
    url: string;
  }[];
  // Shared
  audioUrl?: string;
}

export interface SubmitRevisionTaskRequest {
  topicId: number;
  taskId: number;
  correctCount: number;
  totalCount: number;
}

export interface SubmitRevisionTaskResponse {
  knEarned: number;
  totalKn: number;
  streakCount: number;
  score: number;
}

// Service

export const generalRevisionService = {
  /**
   * Lấy danh sách 10 topic + tasks từ backend.
   * GET /api/general-revision/topics
   */
  getTopics: async (): Promise<RevisionTopicDto[]> => {
    const res = await apiClient.get<RevisionTopicDto[]>("/general-revision/topics");
    return res.data;
  },

  /**
   * Lấy câu hỏi của một task từ MongoDB.
   * GET /api/general-revision/tasks/{taskId}/questions
   */
  getTaskQuestions: async (taskId: number): Promise<RevisionQuestionDto[]> => {
    const res = await apiClient.get<RevisionQuestionDto[]>(
      `/general-revision/tasks/${taskId}/questions`
    );
    return res.data;
  },

  /**
   * Submit kết quả sau khi hoàn thành task — cộng KN, XP, streak.
   * POST /api/general-revision/tasks/submit
   */
  submitTask: async (req: SubmitRevisionTaskRequest): Promise<SubmitRevisionTaskResponse> => {
    const res = await apiClient.post<SubmitRevisionTaskResponse>(
      "/general-revision/tasks/submit",
      req
    );
    return res.data;
  },
};
