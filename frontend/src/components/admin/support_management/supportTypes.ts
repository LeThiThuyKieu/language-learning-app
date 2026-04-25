export type SupportStatus = "Chưa xử lý" | "Đang xử lý" | "Đã phản hồi";
export type SupportCategory = "Bắt đầu học" | "Tài khoản" | "Thanh toán" | "Bài học" | "Kỹ thuật" | "Nội dung học" | "Khác";

export type SupportThread = {
    id: number;
    userId?: number | null;
    name: string;
    email: string;
    category: SupportCategory;
    message: string;
    createdAt: string;
    sentAt: string;
    status: SupportStatus;
};

export const SUPPORT_STATUS_FILTERS: Array<"Tất cả" | SupportStatus> = ["Tất cả", "Chưa xử lý", "Đang xử lý", "Đã phản hồi"];
