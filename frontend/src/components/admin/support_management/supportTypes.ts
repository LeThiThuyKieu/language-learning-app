export type SupportStatus = "Chưa xử lý" | "Đang xử lý" | "Đã phản hồi";
export type SupportCategory = "Bắt đầu học" | "Tài khoản" | "Thanh toán" | "Bài học" | "Kỹ thuật" | "Nội dung học" | "Khác";

export type SupportMessage = {
    senderType: "USER" | "ADMIN";
    message: string;
    createdAt: string;
};

export type SupportThread = {
    id: number;
    userId?: number | null;
    name: string;
    email: string;
    category: SupportCategory;
    /** Luôn là câu hỏi đầu tiên của user, dùng để hiển thị trong list */
    message: string;
    createdAt: string;
    sentAt: string;
    status: SupportStatus;
    /** Full conversation, chỉ có khi đã load detail */
    messages?: SupportMessage[];
};

export const SUPPORT_STATUS_FILTERS: Array<"Tất cả" | SupportStatus> = ["Tất cả", "Chưa xử lý", "Đang xử lý", "Đã phản hồi"];
