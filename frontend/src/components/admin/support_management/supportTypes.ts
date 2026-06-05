export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type SupportCategory = "Bắt đầu học" | "Tài khoản" | "Thanh toán" | "Bài học" | "Kỹ thuật" | "Nội dung học" | "Khác";

export type SupportMessage = {
    senderType: "USER" | "ADMIN" | "BOT";
    message: string;
    createdAt: string;
};

export type SupportEmailLog = {
    id: number;
    ticketId: number;
    toEmail: string;
    subject: string;
    status: "SUCCESS" | "FAILED";
    errorMessage: string | null;
    sentAt: string;
};

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
    messages?: SupportMessage[];
};

export const SUPPORT_STATUS_FILTERS: Array<"Tất cả" | SupportStatus> = [
    "Tất cả",
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
];

// Label hiển thị cho từng status
export const STATUS_LABEL: Record<SupportStatus, string> = {
    OPEN:        "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED:    "Resolved",
    CLOSED:      "Closed",
};

// Style badge cho từng status
export const STATUS_STYLE: Record<SupportStatus, string> = {
    OPEN:        "bg-rose-100 text-rose-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    RESOLVED:    "bg-emerald-100 text-emerald-700",
    CLOSED:      "bg-gray-100 text-gray-500",
};
