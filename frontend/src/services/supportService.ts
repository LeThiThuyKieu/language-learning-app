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

/** Item trong danh sách ticket trả về từ backend */
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

/** Một tin nhắn trong hội thoại ticket */
type BackendSupportMessage = {
    senderType: "USER" | "ADMIN";
    message: string;
    createdAt: string;
};

/** Chi tiết ticket kèm toàn bộ hội thoại */
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

/** Map tên chủ đề hiển thị → categoryId trong DB */
const CATEGORY_ID_BY_TOPIC: Record<string, number> = {
    "Bắt đầu học": 1,
    "Tài khoản":   2,
    "Bài học":     3,
    "Kỹ thuật":    4,
    "Khác":        5,
};

/** Ép kiểu status string từ backend về SupportStatus của frontend */
function toSupportStatus(status: BackendSupportListItem["status"] | BackendSupportDetail["status"]): SupportStatus {
    return status;
}

/** Kiểm tra displayName có nằm trong danh sách category hợp lệ không, fallback "Khác" */
function toSupportCategory(displayName: string): SupportCategory {
    const allowed: SupportCategory[] = ["Bắt đầu học", "Tài khoản", "Thanh toán", "Bài học", "Kỹ thuật", "Nội dung học", "Khác"];
    return allowed.includes(displayName as SupportCategory) ? (displayName as SupportCategory) : "Khác";
}

/** Chuyển ISO date string thành chuỗi thời gian tương đối (vd: "5 phút trước") */
function toRelativeTime(dateIso: string): string {
    const date    = new Date(dateIso);
    const diffMs  = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
}

/** Map BackendSupportListItem → SupportThread, dùng cho danh sách (không có messages) */
function mapListItemToThread(item: BackendSupportListItem): SupportThread {
    return {
        id:        item.id,
        userId:    item.userId,
        name:      item.requesterName || item.requesterEmail?.split("@")[0] || "Người dùng",
        email:     item.requesterEmail,
        category:  toSupportCategory(item.categoryDisplayName),
        message:   item.latestMessage || "",
        createdAt: toRelativeTime(item.createdAt),
        sentAt:    item.createdAt,
        status:    toSupportStatus(item.status),
    };
}

/** Map BackendSupportDetail → SupportThread kèm toàn bộ messages */
function mapDetailToThread(detail: BackendSupportDetail): SupportThread {
    const firstUserMessage = detail.messages.find((m) => m.senderType === "USER")?.message ?? "";
    return {
        id:        detail.id,
        userId:    detail.userId,
        name:      detail.requesterName || detail.requesterEmail?.split("@")[0] || "Người dùng",
        email:     detail.requesterEmail,
        category:  toSupportCategory(detail.categoryDisplayName),
        message:   firstUserMessage, // message luôn là câu hỏi đầu tiên của user
        createdAt: toRelativeTime(detail.createdAt),
        sentAt:    detail.createdAt,
        status:    toSupportStatus(detail.status),
        messages:  detail.messages.map((m) => ({
            senderType: m.senderType,
            message:    m.message,
            createdAt:  toRelativeTime(m.createdAt),
        })),
    };
}

export const supportService = {

    /** Lấy danh sách ticket cho admin, hỗ trợ phân trang, sắp xếp và lọc theo source (CHAT/EMAIL) */
    async getAdminTickets(page = 0, size = 100, sort: "asc" | "desc" = "desc", source?: "CHAT" | "EMAIL"): Promise<SupportThread[]> {
        const params = new URLSearchParams({ page: String(page), size: String(size), sort });
        if (source) params.set("source", source);
        const res = await apiClient.get<ApiResponse<PageResponse<BackendSupportListItem>>>(
            `/admin/support-management/tickets?${params.toString()}`,
        );
        return res.data.data.content.map(mapListItemToThread);
    },

    /** Lấy chi tiết ticket cho admin (chỉ đọc, không đổi status) */
    async getAdminTicketDetail(ticketId: number): Promise<SupportThread> {
        const res = await apiClient.get<ApiResponse<BackendSupportDetail>>(`/admin/support-management/tickets/${ticketId}`);
        return mapDetailToThread(res.data.data);
    },

    /** Admin click mở ticket → tự động chuyển OPEN → IN_PROGRESS, trả về full conversation */
    async viewAdminTicket(ticketId: number): Promise<SupportThread> {
        const res = await apiClient.post<ApiResponse<BackendSupportDetail>>(`/admin/support-management/tickets/${ticketId}/view`);
        return mapDetailToThread(res.data.data);
    },

    /** Admin gửi phản hồi vào ticket */
    async replyAdminTicket(ticketId: number, message: string): Promise<SupportThread> {
        const res = await apiClient.post<ApiResponse<BackendSupportDetail>>(
            `/admin/support-management/tickets/${ticketId}/reply`,
            { message },
        );
        return mapDetailToThread(res.data.data);
    },

    /** User tạo ticket mới với tin nhắn đầu tiên, source mặc định là EMAIL */
    async createUserTicket(topic: string, message: string, source: "CHAT" | "EMAIL" = "EMAIL"): Promise<{ id: number }> {
        const categoryId = CATEGORY_ID_BY_TOPIC[topic] ?? CATEGORY_ID_BY_TOPIC["Khác"];
        const res = await apiClient.post<ApiResponse<{ id: number }>>("/users/support/tickets", {
            categoryId,
            message,
            source,
        });
        return { id: res.data.data?.id ?? 0 };
    },

    /** Guest (chưa đăng nhập) gửi ticket qua form email */
    async createGuestTicket(name: string, email: string, topic: string, message: string): Promise<void> {
        const categoryId = CATEGORY_ID_BY_TOPIC[topic] ?? CATEGORY_ID_BY_TOPIC["Khác"];
        await apiClient.post<ApiResponse<unknown>>("/public/support/tickets", {
            categoryId,
            message,
            guestName:  name,
            guestEmail: email,
        });
    },

    /** Lấy danh sách category hỗ trợ (public, không cần auth) */
    async getCategories(): Promise<{ id: number; displayName: string; colorBg: string; colorText: string }[]> {
        const res = await apiClient.get<ApiResponse<{ id: number; displayName: string; colorBg: string; colorText: string }[]>>("/public/support/categories");
        return res.data.data ?? [];
    },

    /** User gửi thêm tin nhắn vào ticket đang mở (follow-up) */
    async sendUserMessage(ticketId: number, message: string): Promise<SupportThread> {
        const res = await apiClient.post<ApiResponse<BackendSupportDetail>>(
            `/users/support/tickets/${ticketId}/messages`,
            { message },
        );
        return mapDetailToThread(res.data.data);
    },

    /** Cập nhật status ticket — dùng cho nút "Hoàn tất" của admin */
    async updateTicketStatus(ticketId: number, status: string): Promise<SupportThread> {
        const res = await apiClient.patch<ApiResponse<BackendSupportDetail>>(
            `/admin/support-management/tickets/${ticketId}/status`,
            { status },
        );
        return mapDetailToThread(res.data.data);
    },

    /** Lấy chi tiết ticket của user hiện tại, dùng để khôi phục chat từ localStorage */
    async getMyTicketDetail(ticketId: number): Promise<SupportThread> {
        const res = await apiClient.get<ApiResponse<BackendSupportDetail>>(`/users/support/tickets/${ticketId}`);
        return mapDetailToThread(res.data.data);
    },

    /** Lấy danh sách ticket còn mở của user theo category — dùng cho chatbox gợi ý ticket cũ */
    async getActiveTicketsByCategory(categoryId: number): Promise<SupportThread[]> {
        const res = await apiClient.get<ApiResponse<BackendSupportListItem[]>>(
            `/users/support/tickets/active?categoryId=${categoryId}`,
        );
        return (res.data.data ?? []).map(mapListItemToThread);
    },
};
