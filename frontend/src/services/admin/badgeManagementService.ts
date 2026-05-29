import apiClient from "@/config/api.ts";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface AdminBadge {
    id: number;
    badgeName: string;
    description: string | null;
    requiredKn: number;
    iconUrl: string | null;
    status: "active" | "inactive";
    recipientCount: number;
}

export interface BadgeUsageStat {
    id: number;
    badgeName: string;
    requiredKn: number | null;
    recipientCount: number;
    recipientShare: number;
}

export interface BadgeStats {
    totalBadges: number;
    totalAwards: number;
    uniqueEarners: number;
    averageRequiredKn: number;
    minRequiredKn: number | null;
    maxRequiredKn: number | null;
    topBadgeName: string | null;
    topBadgeRecipients: number;
    badgeUsage: BadgeUsageStat[];
}

export interface BadgeUpsertPayload {
    badgeName: string;
    description: string;
    requiredKn: number;
    status: "active" | "inactive";
    file?: File | null;
    iconUrl?: string | null;
}

function mapBadge(badge: AdminBadge): AdminBadge {
    return {
        ...badge,
        description: badge.description?.trim() ? badge.description : null,
        iconUrl: badge.iconUrl?.trim() ? badge.iconUrl : null,
        status: badge.status === "inactive" ? "inactive" : "active",
    };
}

function buildBadgeFormData(payload: BadgeUpsertPayload): FormData {
    const formData = new FormData();
    formData.append("badgeName", payload.badgeName);
    formData.append("description", payload.description);
    formData.append("requiredKn", String(payload.requiredKn));
    formData.append("status", payload.status);

    if (payload.iconUrl) {
        formData.append("iconUrl", payload.iconUrl);
    }

    if (payload.file) {
        formData.append("file", payload.file);
    }

    return formData;
}

export const badgeManagementService = {
    async getBadges(page = 0, size = 8, keyword = ""): Promise<{ badges: AdminBadge[]; total: number; totalPages: number; page: number; size: number }> {
        const res = await apiClient.get<ApiResponse<PageResponse<AdminBadge>>>("/admin/badges", {
            params: { page, size, keyword: keyword.trim() || undefined },
        });
        const data = res.data.data;
        return {
            badges: data.content.map(mapBadge),
            total: data.totalElements,
            totalPages: data.totalPages,
            page: data.number,
            size: data.size,
        };
    },

    async getStats(): Promise<BadgeStats> {
        const res = await apiClient.get<ApiResponse<BadgeStats>>("/admin/badges/stats");
        return res.data.data;
    },

    async uploadBadgeImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);

        const res = await apiClient.post<ApiResponse<string>>("/admin/badges/image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data.data;
    },

    async createBadge(payload: BadgeUpsertPayload): Promise<AdminBadge> {
        const res = await apiClient.post<ApiResponse<AdminBadge>>("/admin/badges", buildBadgeFormData(payload), {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return mapBadge(res.data.data);
    },

    async updateBadge(id: number, payload: BadgeUpsertPayload): Promise<AdminBadge> {
        const res = await apiClient.put<ApiResponse<AdminBadge>>(`/admin/badges/${id}`, buildBadgeFormData(payload), {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return mapBadge(res.data.data);
    },
};