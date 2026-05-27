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
    async getFeedbacks(): Promise<AdminFeedbackItem[]> {
        const response = await apiClient.get<ApiResponse<AdminFeedbackItem[]>>("/admin/feedback");
        return response.data.data ?? [];
    },

    /**
     * Lấy thống kê tổng quan cho feedback.
     */
    async getStats(): Promise<AdminFeedbackStats> {
        const response = await apiClient.get<ApiResponse<AdminFeedbackStats>>("/admin/feedback/stats");
        return response.data.data;
    },
};