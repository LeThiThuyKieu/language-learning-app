import apiClient from "@/config/api";

export interface AdminTopicListItem {
    id: number;
    title: string;
    description: string;
    orderIndex: number;
    isActive: boolean;
    taskCount: number;
    questionCount: number;
}

export interface AdminTaskDetail {
    id: number;
    taskIndex: number;
    taskLabel: string;
    questionType: string;
    description: string;
    questionCount: number;
}

export interface AdminTopicDetail {
    id: number;
    title: string;
    description: string;
    orderIndex: number;
    isActive: boolean;
    totalQuestions: number;
    tasks: AdminTaskDetail[];
}

export interface MatchingPair {
    left: string;
    right: string;
}

export interface WritingCategory {
    label: string;
    slots: number;
    [key: string]: unknown;
}

export interface WritingImage {
    url: string;
}

export interface AdminQuestion {
    indexId: number;
    mongoId: string;
    topicId: number;
    taskId: number;
    questionType: "VOCAB_IMAGE" | "LISTENING" | "MATCHING" | "WRITING";
    orderIndex: number;
    correctAnswer?: string;
    imageUrl?: string;
    questionText?: string;
    sentence?: string;
    audioUrl?: string;
    pairs?: MatchingPair[];
    categories?: WritingCategory[];
    images?: WritingImage[];
}

export interface SaveTopicRequest {
    title: string;
    description?: string;
    orderIndex?: number;
    isActive?: boolean;
}

export interface SaveTaskRequest {
    taskLabel: string;
    questionType: string;
    description?: string;
    taskIndex?: number;
}

export interface SaveQuestionRequest {
    questionType: string;
    orderIndex: number;
    imageUrl?: string;
    questionText?: string;
    sentence?: string;
    audioUrl?: string;
    pairs?: MatchingPair[];
    categories?: WritingCategory[];
    images?: WritingImage[];
    correctAnswer?: string;
}

type ApiResponse<T> = { success: boolean; message: string; data: T };

const BASE = "/admin/revision/topics";

export const revisionApi = {
    // Topics
    getTopics: () =>
        apiClient.get<ApiResponse<AdminTopicListItem[]>>(BASE).then(r => r.data.data),

    getTopicDetail: (topicId: number) =>
        apiClient.get<ApiResponse<AdminTopicDetail>>(`${BASE}/${topicId}`).then(r => r.data.data),

    createTopic: (req: SaveTopicRequest) =>
        apiClient.post<ApiResponse<AdminTopicListItem>>(BASE, req).then(r => r.data.data),

    updateTopic: (topicId: number, req: SaveTopicRequest) =>
        apiClient.put<ApiResponse<AdminTopicListItem>>(`${BASE}/${topicId}`, req).then(r => r.data.data),

    deleteTopic: (topicId: number) =>
        apiClient.delete(`${BASE}/${topicId}`),

    // Tasks
    getTasks: (topicId: number) =>
        apiClient.get<ApiResponse<AdminTaskDetail[]>>(`${BASE}/${topicId}/tasks`).then(r => r.data.data),

    getTaskDetail: (topicId: number, taskId: number) =>
        apiClient.get<ApiResponse<AdminTaskDetail>>(`${BASE}/${topicId}/tasks/${taskId}`).then(r => r.data.data),

    createTask: (topicId: number, req: SaveTaskRequest) =>
        apiClient.post<ApiResponse<AdminTaskDetail>>(`${BASE}/${topicId}/tasks`, req).then(r => r.data.data),

    updateTask: (topicId: number, taskId: number, req: SaveTaskRequest) =>
        apiClient.put<ApiResponse<AdminTaskDetail>>(`${BASE}/${topicId}/tasks/${taskId}`, req).then(r => r.data.data),

    deleteTask: (topicId: number, taskId: number) =>
        apiClient.delete(`${BASE}/${topicId}/tasks/${taskId}`),

    // Questions
    getQuestions: (topicId: number, taskId: number) =>
        apiClient.get<ApiResponse<AdminQuestion[]>>(`${BASE}/${topicId}/tasks/${taskId}/questions`).then(r => r.data.data),

    getQuestion: (topicId: number, taskId: number, mongoId: string) =>
        apiClient.get<ApiResponse<AdminQuestion>>(`${BASE}/${topicId}/tasks/${taskId}/questions/${mongoId}`).then(r => r.data.data),

    createQuestion: (topicId: number, taskId: number, req: SaveQuestionRequest) =>
        apiClient.post<ApiResponse<AdminQuestion>>(`${BASE}/${topicId}/tasks/${taskId}/questions`, req).then(r => r.data.data),

    updateQuestion: (topicId: number, taskId: number, mongoId: string, req: SaveQuestionRequest) =>
        apiClient.put<ApiResponse<AdminQuestion>>(`${BASE}/${topicId}/tasks/${taskId}/questions/${mongoId}`, req).then(r => r.data.data),

    deleteQuestion: (topicId: number, taskId: number, mongoId: string) =>
        apiClient.delete(`${BASE}/${topicId}/tasks/${taskId}/questions/${mongoId}`),

    // Reorder
    reorderTopics: (items: { id: number; orderIndex: number }[]) =>
        apiClient.put(`${BASE}/reorder`, items),

    reorderTasks: (topicId: number, items: { id: number; orderIndex: number }[]) =>
        apiClient.put(`${BASE}/${topicId}/tasks/reorder`, items),

    reorderQuestions: (topicId: number, taskId: number, items: { mongoId: string; orderIndex: number }[]) =>
        apiClient.put(`${BASE}/${topicId}/tasks/${taskId}/questions/reorder`, items),

    // Media upload
    uploadQuestionImage: (topicId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post<ApiResponse<string>>(`${BASE}/${topicId}/upload/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }).then(r => r.data.data);
    },

    uploadQuestionAudio: (topicId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post<ApiResponse<string>>(`${BASE}/${topicId}/upload/audio`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }).then(r => r.data.data);
    },

    importQuestions: (topicId: number, taskId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post<ApiResponse<{ imported: number; errors: string[] }>>(
            `${BASE}/${topicId}/tasks/${taskId}/questions/import`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        ).then(r => r.data);
    },
};
