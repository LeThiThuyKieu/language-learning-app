import apiClient from "@/config/api";

export interface ExamProgressStats {
    totalUsers: number;
    totalAttempts: number;
    /** TB tỉ lệ đúng câu có đáp án chuẩn (Listening + R&W gộp), % */
    avgObjectiveAccuracy: number | null;
    /** TB điểm AI (Writing + Speaking gộp), % */
    avgAiScore: number | null;
}

export interface ExamProgressSummary {
    userId: number;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    totalAttempts: number;
    /** TB tỉ lệ đúng Listening, % */
    avgListeningAccuracy: number | null;
    /** TB tỉ lệ đúng R&W objective, % */
    avgRwAccuracy: number | null;
    /** TB LLM writing score (0-100) */
    avgWritingScore: number | null;
    /** TB LLM speaking score (0-100) */
    avgSpeakingScore: number | null;
    lastAttemptAt: string | null;
}

export interface AttemptSummary {
    attemptId: number;
    testId: number;
    testTitle: string;
    cefrLevel: string | null;
    testNumber: number | null;
    correctCount: number;
    totalCount: number;
    listeningCorrect: number;
    listeningTotal: number;
    rwCorrect: number;
    rwTotal: number;
    writingScore: number | null;
    speakingScore: number | null;
    attemptedAt: string;
}

export interface ExamProgressDetail extends Omit<ExamProgressSummary, 'avgListeningAccuracy' | 'avgRwAccuracy' | 'avgWritingScore' | 'avgSpeakingScore'> {
    avgListeningAccuracy: number | null;
    avgRwAccuracy: number | null;
    avgWritingScore: number | null;
    avgSpeakingScore: number | null;
    attempts: AttemptSummary[];
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    number: number;
    size: number;
}

//  Service 

export const examProgressService = {
    getStats: async (): Promise<ExamProgressStats> => {
        const res = await apiClient.get<{ data: ExamProgressStats }>(
            "/admin/exam-progress/stats"
        );
        return res.data.data;
    },

    getSummaryList: async (
        page = 0,
        size = 10,
        search?: string
    ): Promise<PageResponse<ExamProgressSummary>> => {
        const params: Record<string, string | number> = { page, size };
        if (search) params.search = search;
        const res = await apiClient.get<{ data: PageResponse<ExamProgressSummary> }>(
            "/admin/exam-progress",
            { params }
        );
        return res.data.data;
    },

    getDetail: async (userId: number): Promise<ExamProgressDetail> => {
        const res = await apiClient.get<{ data: ExamProgressDetail }>(
            `/admin/exam-progress/${userId}`
        );
        return res.data.data;
    },
};
