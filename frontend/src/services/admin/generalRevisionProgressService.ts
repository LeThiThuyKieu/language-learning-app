import apiClient from "@/config/api";

export interface TaskAttemptSummary {
    taskId: number;
    taskLabel: string;
    questionType: string;
    attemptCount: number;
    bestScore: number | null;
    lastScore: number | null;
    lastAttemptAt: string | null;
}

export interface TopicProgressDetail {
    topicId: number;
    title: string;
    description: string | null;
    completedTasks: number;
    status: "not_started" | "in_progress" | "completed";
    updatedAt: string | null;
    tasks: TaskAttemptSummary[];
}

export interface GeneralRevisionProgressSummary {
    userId: number;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    completedTopics: number;
    totalTopics: number;
    totalAttempts: number;
    progressLabel: string | null;
}

export interface GeneralRevisionProgressDetail extends GeneralRevisionProgressSummary {
    topics: TopicProgressDetail[];
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    number: number;
    size: number;
}

export const generalRevisionProgressService = {
    getSummaryList: async (
        page = 0,
        size = 10,
        search?: string
    ): Promise<PageResponse<GeneralRevisionProgressSummary>> => {
        const params: Record<string, string | number> = { page, size };
        if (search) params.search = search;
        const res = await apiClient.get<{ data: PageResponse<GeneralRevisionProgressSummary> }>(
            "/admin/general-revision-progress",
            { params }
        );
        return res.data.data;
    },

    getDetail: async (userId: number): Promise<GeneralRevisionProgressDetail> => {
        const res = await apiClient.get<{ data: GeneralRevisionProgressDetail }>(
            `/admin/general-revision-progress/${userId}`
        );
        return res.data.data;
    },
};
