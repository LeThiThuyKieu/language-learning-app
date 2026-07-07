import apiClient from "@/config/api";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExamTestStats {
    totalTests: number;
    activeTests: number;
    inactiveTests: number;
    totalQuestions: number;
}

export interface AdminExamQuestionDto {
    id: number;
    mongoDocId: string;
    questionType: string;
    questionNumberStart: number;
    questionNumberEnd: number;
    correctAnswer: string | null;
    orderIndex: number;
    createdAt: string | null;
}

export interface AdminExamPartDto {
    id: number;
    partNumber: number;
    orderIndex: number;
    questions: AdminExamQuestionDto[];
}

export interface AdminExamPaperDto {
    id: number;
    paperType: "LISTENING" | "READING_WRITING" | "SPEAKING";
    durationMinutes: number;
    audioUrl: string | null;
    orderIndex: number;
    parts: AdminExamPartDto[] | null;
    totalQuestions: number;
}

export interface AdminExamTestDto {
    id: number;
    cefrLevel: "A2" | "B1" | "B2" | "C1" | "C2";
    testNumber: number;
    title: string;
    description: string | null;
    isActive: boolean;
    createdAt: string | null;
    papers: AdminExamPaperDto[];
    totalQuestions: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ExamTestCreatePayload {
    cefrLevel: string;
    testNumber: number;
    title: string;
    description?: string;
    isActive?: boolean;
}

export interface ExamTestUpdatePayload {
    cefrLevel: string;
    testNumber: number;
    title: string;
    description?: string;
    isActive?: boolean;
}

export interface ExamPaperUpdatePayload {
    durationMinutes: number;
    audioUrl: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const examManagementService = {
    /**
     * Lấy danh sách tất cả exam tests có phân trang.
     */
    async getTests(
        page = 0,
        size = 10,
        level?: string
    ): Promise<PageResponse<AdminExamTestDto>> {
        const params: Record<string, unknown> = { page, size };
        if (level) params.level = level;
        const res = await apiClient.get<ApiResponse<PageResponse<AdminExamTestDto>>>(
            "/admin/exam-tests",
            { params }
        );
        return res.data.data;
    },

    /**
     * Lấy thống kê tổng quan.
     */
    async getStats(): Promise<ExamTestStats> {
        const res = await apiClient.get<ApiResponse<ExamTestStats>>("/admin/exam-tests/stats");
        return res.data.data;
    },

    /**
     * Lấy chi tiết 1 test (bao gồm papers + parts + questions).
     */
    async getTestDetail(id: number): Promise<AdminExamTestDto> {
        const res = await apiClient.get<ApiResponse<AdminExamTestDto>>(`/admin/exam-tests/${id}`);
        return res.data.data;
    },

    /**
     * Tạo exam test mới.
     */
    async createTest(payload: ExamTestCreatePayload): Promise<AdminExamTestDto> {
        const res = await apiClient.post<ApiResponse<AdminExamTestDto>>(
            "/admin/exam-tests",
            payload
        );
        return res.data.data;
    },

    /**
     * Cập nhật thông tin exam test.
     */
    async updateTest(id: number, payload: ExamTestUpdatePayload): Promise<AdminExamTestDto> {
        const res = await apiClient.put<ApiResponse<AdminExamTestDto>>(
            `/admin/exam-tests/${id}`,
            payload
        );
        return res.data.data;
    },

    /**
     * Toggle active/inactive.
     */
    async toggleVisibility(id: number): Promise<AdminExamTestDto> {
        const res = await apiClient.patch<ApiResponse<AdminExamTestDto>>(
            `/admin/exam-tests/${id}/toggle-visibility`
        );
        return res.data.data;
    },

    /**
     * Cập nhật paper (duration, audio URL).
     */
    async updatePaper(
        paperId: number,
        payload: ExamPaperUpdatePayload
    ): Promise<AdminExamPaperDto> {
        const res = await apiClient.put<ApiResponse<AdminExamPaperDto>>(
            `/admin/exam-tests/papers/${paperId}`,
            payload
        );
        return res.data.data;
    },
};
