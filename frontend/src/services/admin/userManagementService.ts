import apiClient from "@/config/api.ts";
import type { AdminUser } from "@/pages/Admin/UserManagementPage.tsx";

export interface AdminUserStats {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    newUsersToday: number;
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

interface BackendUser {
    id: number;
    email: string;
    authProvider: string;
    status: string;
    createdAt: string;
    lastLogin: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    totalXp: number;
    streakCount: number;
    currentLevel: number | null;
    role: string;
}

/**
 * Chuyển đổi dữ liệu user từ backend sang định dạng AdminUser dùng trên UI.
 * - Map status: "active" → "Active", "banned" → "Banned"
 * - Map role: "ADMIN" → "Admin", "USER" → "User"
 * - Tính lastLogin dạng "X phút/giờ/ngày trước"
 * - Fallback avatar bằng ui-avatars nếu không có ảnh
 */
function mapUser(u: BackendUser): AdminUser {
    const statusMap: Record<string, AdminUser["status"]> = {
        active: "Active",
        banned: "Banned",
    };
    const roleMap: Record<string, AdminUser["role"]> = {
        ADMIN: "Admin",
        USER: "User",
    };

    let lastLogin = "Chưa đăng nhập";
    if (u.lastLogin) {
        const diff = Date.now() - new Date(u.lastLogin).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) lastLogin = "Vừa xong";
        else if (mins < 60) lastLogin = `${mins} phút trước`;
        else if (mins < 1440) lastLogin = `${Math.floor(mins / 60)} giờ trước`;
        else lastLogin = `${Math.floor(mins / 1440)} ngày trước`;
    }

    let joinedDate = "";
    if (u.createdAt) {
        const d = new Date(u.createdAt);
        joinedDate = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    return {
        id: u.id,
        name: u.fullName || u.email.split("@")[0],
        email: u.email,
        avatar: u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.email)}&background=f97316&color=fff`,
        role: roleMap[u.role] ?? "User",
        status: statusMap[u.status] ?? "Inactive",
        authProvider: u.authProvider as AdminUser["authProvider"],
        xp: u.totalXp ?? 0,
        streak: u.streakCount ?? 0,
        lastLogin,
        level: u.currentLevel ?? undefined,
        joinedDate,
    };
}

export const userManagementService = {
    /**
     * Lấy danh sách người dùng có phân trang.
     * GET /api/admin/user_management?page={page}&size={size}
     * @returns danh sách users đã map + tổng số bản ghi
     */
    async getUsers(page = 0, size = 10): Promise<{ users: AdminUser[]; total: number }> {
        const res = await apiClient.get<{ data: PageResponse<BackendUser> }>(
            `/admin/user_management?page=${page}&size=${size}`
        );
        const data = res.data.data;
        return {
            users: data.content.map(mapUser),
            total: data.totalElements,
        };
    },

    /**
     * Lấy thống kê tổng quan người dùng.
     * GET /api/admin/user_management/stats
     * @returns tổng users, đang hoạt động, bị cấm, mới hôm nay
     */
    async getStats(): Promise<AdminUserStats> {
        const res = await apiClient.get<{ data: AdminUserStats }>("/admin/user_management/stats");
        return res.data.data;
    },

    /**
     * Cấm một người dùng theo ID.
     * PUT /api/admin/user_management/{id}/ban
     * @param id - ID của người dùng cần cấm
     * @returns thông tin user sau khi cập nhật
     */
    async banUser(id: number): Promise<AdminUser> {
        const res = await apiClient.put<{ data: BackendUser }>(`/admin/user_management/${id}/ban`);
        return mapUser(res.data.data);
    },

    /**
     * Bỏ cấm một người dùng theo ID.
     * PUT /api/admin/user_management/{id}/unban
     * @param id - ID của người dùng cần bỏ cấm
     * @returns thông tin user sau khi cập nhật
     */
    async unbanUser(id: number): Promise<AdminUser> {
        const res = await apiClient.put<{ data: BackendUser }>(`/admin/user_management/${id}/unban`);
        return mapUser(res.data.data);
    },
};
