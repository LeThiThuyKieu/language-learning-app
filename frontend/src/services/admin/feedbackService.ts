import apiClient from "@/config/api";

type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

export interface AdminFeedbackItem {
    id: number;
    userId: number;
    email: string;
    name: string;
    treeId: number;
    tree: string;
    rating: number;
    accuracy: number;
    createdAt: string;
    comment?: string;
}

export interface AdminFeedbackStats {
    totalFeedback: number;
    totalUsers: number;
    totalTrees: number;
}

export const feedbackService = {
    /**
     * Lấy toàn bộ feedback cho trang Admin.
     */
    async getFeedbacks(params?: {
        page?: number;
        size?: number;
        treeId?: number;
        userEmail?: string;
        minRating?: number;
        maxRating?: number;
        from?: string;
        to?: string;
    }): Promise<{ items: AdminFeedbackItem[]; page: number; size: number; totalElements: number; totalPages: number }> {
        const response = await apiClient.get<ApiResponse<any>>("/admin/feedback", { params });
        const data = response.data.data ?? { items: [] };
        return {
            items: data.items ?? [],
            page: data.page ?? 0,
            size: data.size ?? 0,
            totalElements: data.totalElements ?? 0,
            totalPages: data.totalPages ?? 0,
        };
    },

    /**
     * Lấy thống kê tổng quan cho feedback.
     */
    async getStats(): Promise<AdminFeedbackStats> {
        const response = await apiClient.get<ApiResponse<AdminFeedbackStats>>("/admin/feedback/stats");
        return response.data.data;
    },
};