import apiClient from "@/config/api.ts";

export interface PlacementTestStats {
    totalTests: number;
    completedTests: number;
    inProgressTests: number;
    averageScore: number;
}

export interface PlacementTestRecord {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    userAvatar: string;
    status: "IN_PROGRESS" | "COMPLETED";
    totalScore: number | null;
    detectedLevel: string | null;
    createdAt: string;
    completedAt: string | null;
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

interface BackendPlacementTest {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    status: string;
    totalScore: number | null;
    detectedLevelName: string | null;
    createdAt: string;
    completedAt: string | null;
}

/**
 * Chuyển đổi dữ liệu placement test từ backend sang định dạng UI
 */
function mapPlacementTest(t: BackendPlacementTest): PlacementTestRecord {
    let createdAt = "N/A";
    if (t.createdAt) {
        const d = new Date(t.createdAt);
        createdAt = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    let completedAt = null;
    if (t.completedAt) {
        const d = new Date(t.completedAt);
        completedAt = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return {
        id: t.id,
        userId: t.userId,
        userName: t.userName || t.userEmail.split("@")[0],
        userEmail: t.userEmail,
        userAvatar: t.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.userName || t.userEmail)}&background=f97316&color=fff`,
        status: t.status as PlacementTestRecord["status"],
        totalScore: t.totalScore,
        detectedLevel: t.detectedLevelName,
        createdAt,
        completedAt,
    };
}

export const placementTestManagementService = {
    /**
     * Lấy danh sách placement tests có phân trang
     * GET /api/admin/placement-tests?page={page}&size={size}
     */
    async getTests(page = 0, size = 10): Promise<{ tests: PlacementTestRecord[]; total: number }> {
        const res = await apiClient.get<{ data: PageResponse<BackendPlacementTest> }>(
            `/admin/placement-tests?page=${page}&size=${size}`
        );
        const data = res.data.data;
        return {
            tests: data.content.map(mapPlacementTest),
            total: data.totalElements,
        };
    },

    /**
     * Lấy thống kê placement tests
     * GET /api/admin/placement-tests/stats
     */
    async getStats(): Promise<PlacementTestStats> {
        const res = await apiClient.get<{ data: PlacementTestStats }>("/admin/placement-tests/stats");
        return res.data.data;
    },

    /**
     * Lấy chi tiết một placement test
     * GET /api/admin/placement-tests/{id}
     */
    async getTestDetail(id: number): Promise<PlacementTestRecord> {
        const res = await apiClient.get<{ data: BackendPlacementTest }>(`/admin/placement-tests/${id}`);
        return mapPlacementTest(res.data.data);
    },

    /**
     * Xóa một placement test
     * DELETE /api/admin/placement-tests/{id}
     */
    async deleteTest(id: number): Promise<void> {
        await apiClient.delete(`/admin/placement-tests/${id}`);
    },
};
