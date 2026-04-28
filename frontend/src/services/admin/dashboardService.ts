import apiClient from "@/config/api.ts";

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    newUsersToday: number;
    totalXp: number;
    completedNodes: number;
    inProgressNodes: number;
    completedPlacement: number;
    usersByLevel: Record<string, number>;
}

export const dashboardService = {
    /**
     * Lấy thống kê tổng quan từ DB cho trang Dashboard Admin
     * GET /api/admin/dashboard/stats
     */
    async getStats(): Promise<DashboardStats> {
        const res = await apiClient.get<{ data: DashboardStats }>("/admin/dashboard/stats");
        return res.data.data;
    },
};
