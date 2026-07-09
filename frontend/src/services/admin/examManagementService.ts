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

// ── Exam Question Detail (Mongo + MySQL combined) ─────────────────────────────

export interface ExamOption {
    id: string;
    text: string | null;
    image_url: string | null;
}

export interface ExamBlankOption {
    number: number;
    options: string[];
}

export interface ExamMatchItem {
    question_number?: number;
    label: string;
    id?: string;
}

export interface ExamStoryImage {
    order: number;
    image_url: string;
    alt?: string;
}

export interface ExamQuestionDetailDto {
    // MySQL
    id: number;
    mongoDocId: string;
    questionType: string;
    questionNumberStart: number;
    questionNumberEnd: number;
    correctAnswer: string | null;
    orderIndex: number;
    partId: number;
    paperId: number;
    paperType: string;
    createdAt: string | null;
    // MongoDB
    section: string;
    instruction: string | null;
    text: string | null;
    options: ExamOption[] | null;
    passageImageUrl: string | null;
    passageText: string | null;
    formTitle: string | null;
    formContent: string | null;
    blanksOptions: ExamBlankOption[] | null;
    instructionDetail: string | null;
    leftItems: ExamMatchItem[] | null;
    rightItems: ExamMatchItem[] | null;
    sentence: string | null;
    writeType: string | null;
    minWords: number | null;
    maxWords: number | null;
    promptText: string | null;
    bulletPoints: string[] | null;
    storyImages: ExamStoryImage[] | null;
}

export interface ExamQuestionSaveRequest {
    partId: number;
    questionType: string;
    questionNumberStart: number;
    questionNumberEnd: number;
    correctAnswer?: string | null;
    orderIndex?: number;
    section: string;
    instruction?: string | null;
    text?: string | null;
    options?: ExamOption[] | null;
    passageImageUrl?: string | null;
    passageText?: string | null;
    formTitle?: string | null;
    formContent?: string | null;
    blanksOptions?: ExamBlankOption[] | null;
    instructionDetail?: string | null;
    leftItems?: ExamMatchItem[] | null;
    rightItems?: ExamMatchItem[] | null;
    sentence?: string | null;
    writeType?: string | null;
    minWords?: number | null;
    maxWords?: number | null;
    promptText?: string | null;
    bulletPoints?: string[] | null;
    storyImages?: ExamStoryImage[] | null;
}

export interface ExamPartCreatePayload {
    partNumber: number;
    orderIndex?: number;
}

export interface ExamPartUpdatePayload {
    partNumber: number;
    orderIndex?: number;
}

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

    /**
     * Tạo part mới trong một paper.
     */
    async createPart(
        paperId: number,
        payload: ExamPartCreatePayload
    ): Promise<AdminExamPartDto> {
        const res = await apiClient.post<ApiResponse<AdminExamPartDto>>(
            `/admin/exam-tests/papers/${paperId}/parts`,
            payload
        );
        return res.data.data;
    },

    /**
     * Cập nhật thông tin part.
     */
    async updatePart(
        partId: number,
        payload: ExamPartUpdatePayload
    ): Promise<AdminExamPartDto> {
        const res = await apiClient.put<ApiResponse<AdminExamPartDto>>(
            `/admin/exam-tests/parts/${partId}`,
            payload
        );
        return res.data.data;
    },

    /**
     * Upload audio file cho Listening paper lên Cloudinary.
     */
    async uploadPaperAudio(paperId: number, file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiClient.post<ApiResponse<string>>(
            `/admin/exam-tests/papers/${paperId}/upload-audio`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return res.data.data;
    },
};

// ── Exam Question API ─────────────────────────────────────────────────────────

export const examQuestionApi = {
    getDetail: async (id: number): Promise<ExamQuestionDetailDto> => {
        const res = await apiClient.get<ApiResponse<ExamQuestionDetailDto>>(`/admin/exam-questions/${id}`);
        return res.data.data;
    },

    getByPart: async (partId: number): Promise<ExamQuestionDetailDto[]> => {
        const res = await apiClient.get<ApiResponse<ExamQuestionDetailDto[]>>(`/admin/exam-questions/by-part/${partId}`);
        return res.data.data;
    },

    create: async (payload: ExamQuestionSaveRequest): Promise<ExamQuestionDetailDto> => {
        const res = await apiClient.post<ApiResponse<ExamQuestionDetailDto>>("/admin/exam-questions", payload);
        return res.data.data;
    },

    update: async (id: number, payload: ExamQuestionSaveRequest): Promise<ExamQuestionDetailDto> => {
        const res = await apiClient.put<ApiResponse<ExamQuestionDetailDto>>(`/admin/exam-questions/${id}`, payload);
        return res.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/exam-questions/${id}`);
    },
};
