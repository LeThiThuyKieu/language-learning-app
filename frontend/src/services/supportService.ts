import apiClient from "@/config/api";
import type { SupportCategory, SupportStatus, SupportThread } from "@/components/admin/support_management/supportTypes";

type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

type PageResponse<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

type BackendSupportListItem = {
    id: number;
    userId: number | null;
    requesterName: string;
    requesterEmail: string;
    categoryId: number;
    categoryName: string;
    categoryDisplayName: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    createdAt: string;
    latestMessage: string;
};

type BackendSupportMessage = {
    senderType: "USER" | "ADMIN";
    message: string;
    createdAt: string;
};

type BackendSupportDetail = {
    id: number;
    userId: number | null;
    requesterName: string;
    requesterEmail: string;
    categoryId: number;
    categoryName: string;
    categoryDisplayName: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    createdAt: string;
    messages: BackendSupportMessage[];
};

const CATEGORY_ID_BY_TOPIC: Record<string, number> = {
    "Bắt đầu học": 1,
    "Tài khoản": 2,
    "Bài học": 3,
    "Kỹ thuật": 4,
    "Khác": 5,
};

function toSupportStatus(status: BackendSupportListItem["status"] | BackendSupportDetail["status"]): SupportStatus {
    if (status === "OPEN") return "Chưa xử lý";
    if (status === "IN_PROGRESS") return "Đang xử lý";
    return "Đã phản hồi";
}

function toSupportCategory(displayName: string): SupportCategory {
    const allowed: SupportCategory[] = ["Bắt đầu học", "Tài khoản", "Thanh toán", "Bài học", "Kỹ thuật", "Nội dung học", "Khác"];
    return allowed.includes(displayName as SupportCategory) ? (displayName as SupportCategory) : "Khác";
}

function toRelativeTime(dateIso: string): string {
    const date = new Date(dateIso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
}

function mapListItemToThread(item: BackendSupportListItem): SupportThread {
    return {
        id: item.id,
        userId: item.userId,
        name: item.requesterName || item.requesterEmail?.split("@")[0] || "Người dùng",
        email: item.requesterEmail,
        category: toSupportCategory(item.categoryDisplayName),
        message: item.latestMessage || "",
        createdAt: toRelativeTime(item.createdAt),
        sentAt: item.createdAt,
        status: toSupportStatus(item.status),
    };
}

function mapDetailToThread(detail: BackendSupportDetail): SupportThread {
    const firstUserMessage = detail.messages.find((m) => m.senderType === "USER")?.message ?? "";
    return {
        id: detail.id,
        userId: detail.userId,
        name: detail.requesterName || detail.requesterEmail?.split("@")[0] || "Người dùng",
        email: detail.requesterEmail,
        category: toSupportCategory(detail.categoryDisplayName),
        // message luôn là câu hỏi đầu tiên của user — dùng cho list bên trái
        message: firstUserMessage,
        createdAt: toRelativeTime(detail.createdAt),
        sentAt: detail.createdAt,
        status: toSupportStatus(detail.status),
        messages: detail.messages.map((m) => ({
            senderType: m.senderType,
            message: m.message,
            createdAt: toRelativeTime(m.createdAt),
        })),
    };
}

export const supportService = {
    async getAdminTickets(page = 0, size = 100, sort: "asc" | "desc" = "desc"): Promise<SupportThread[]> {
        const res = await apiClient.get<ApiResponse<PageResponse<BackendSupportListItem>>>(
            `/admin/support-management/tickets?page=${page}&size=${size}&sort=${sort}`,
        );
        return res.data.data.content.map(mapListItemToThread);
    },

    async getAdminTicketDetail(ticketId: number): Promise<SupportThread> {
        const res = await apiClient.get<ApiResponse<BackendSupportDetail>>(`/admin/support-management/tickets/${ticketId}`);
        return mapDetailToThread(res.data.data);
    },

    // Gọi khi admin click mở ticket — tự động chuyển OPEN → IN_PROGRESS và trả về full conversation
    async viewAdminTicket(ticketId: number): Promise<SupportThread> {
        const res = await apiClient.post<ApiResponse<BackendSupportDetail>>(`/admin/support-management/tickets/${ticketId}/view`);
        return mapDetailToThread(res.data.data);
    },

    async replyAdminTicket(ticketId: number, message: string): Promise<SupportThread> {
        const res = await apiClient.post<ApiResponse<BackendSupportDetail>>(
            `/admin/support-management/tickets/${ticketId}/reply`,
            { message },
        );
        return mapDetailToThread(res.data.data);
    },

    async createUserTicket(topic: string, message: string): Promise<void> {
        const categoryId = CATEGORY_ID_BY_TOPIC[topic] ?? CATEGORY_ID_BY_TOPIC["Khác"];
        await apiClient.post<ApiResponse<unknown>>("/users/support/tickets", {
            categoryId,
            message,
        });
    },

    async createGuestTicket(name: string, email: string, topic: string, message: string): Promise<void> {
        const categoryId = CATEGORY_ID_BY_TOPIC[topic] ?? CATEGORY_ID_BY_TOPIC["Khác"];
        await apiClient.post<ApiResponse<unknown>>("/public/support/tickets", {
            categoryId,
            message,
            guestName: name,
            guestEmail: email,
        });
    },
};
