import apiClient from "@/config/api.ts";

export interface PlacementTestAttempt {
    id: number;
    status: "IN_PROGRESS" | "COMPLETED";
    totalScore: number | null;
    detectedLevelName: string | null;
    createdAt: string;
    completedAt: string | null;
    duration: string | null;
}

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
    /** Thời lượng làm bài, ví dụ "12p 34s" hoặc "1g 02p 15s" */
    duration: string | null;
    /** Tổng số lần user đã làm placement test */
    totalAttempts: number;
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
    totalAttempts: number;
}

/**
 * Chuyển đổi dữ liệu placement test từ backend sang định dạng UI
 */
function mapPlacementTest(t: BackendPlacementTest): PlacementTestRecord {
    function formatDatetime(raw: string | null): string | null {
        if (!raw) return null;
        const d = new Date(raw);
        const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
        const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
        return `${date} ${time}`;
    }

    const createdAt  = formatDatetime(t.createdAt)  ?? "N/A";
    const completedAt = formatDatetime(t.completedAt);

    // Tính thời lượng làm bài (createdAt → completedAt)
    let duration: string | null = null;
    if (t.createdAt && t.completedAt) {
        const diffMs = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
        if (diffMs > 0) {
            const totalSec = Math.floor(diffMs / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            duration = h > 0
                ? `${h}g ${String(m).padStart(2, "0")}p ${String(s).padStart(2, "0")}s`
                : `${String(m).padStart(2, "0")}p ${String(s).padStart(2, "0")}s`;
        }
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
        duration,
        totalAttempts: t.totalAttempts ?? 0,
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

    /**
     * Lịch sử tất cả các lần làm bài của một user
     * GET /api/admin/placement-tests/user/{userId}/history
     */
    async getUserHistory(userId: number): Promise<PlacementTestAttempt[]> {
        const res = await apiClient.get<{ data: Array<{
            id: number;
            status: string;
            totalScore: number | null;
            detectedLevelName: string | null;
            createdAt: string;
            completedAt: string | null;
        }> }>(`/admin/placement-tests/user/${userId}/history`);

        return res.data.data.map(t => {
            const createdAt = t.createdAt
                ? (() => {
                    const d = new Date(t.createdAt);
                    return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`;
                })()
                : "N/A";
            const completedAt = t.completedAt
                ? (() => {
                    const d = new Date(t.completedAt!);
                    return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`;
                })()
                : null;
            let duration: string | null = null;
            if (t.createdAt && t.completedAt) {
                const diffMs = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
                if (diffMs > 0) {
                    const totalSec = Math.floor(diffMs / 1000);
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    duration = h > 0
                        ? `${h}g ${String(m).padStart(2, "0")}p ${String(s).padStart(2, "0")}s`
                        : `${String(m).padStart(2, "0")}p ${String(s).padStart(2, "0")}s`;
                }
            }
            return {
                id: t.id,
                status: t.status as PlacementTestAttempt["status"],
                totalScore: t.totalScore,
                detectedLevelName: t.detectedLevelName,
                createdAt,
                completedAt,
                duration,
            };
        });
    },
};
