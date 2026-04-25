import { AVATAR_OPTIONS } from "@/constants/avatarOptions.ts";

export type SupportStatus = "Chưa xử lý" | "Đang xử lý" | "Đã phản hồi";
export type SupportCategory = "Tài khoản" | "Thanh toán" | "Lỗi kỹ thuật" | "Nội dung học";

export type SupportThread = {
    id: number;
    name: string;
    email: string;
    avatar: string;
    category: SupportCategory;
    subject: string;
    message: string;
    createdAt: string;
    status: SupportStatus;
    unread: boolean;
    device: string;
    appVersion: string;
    timeline: string[];
};

export const SUPPORT_THREADS: SupportThread[] = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        email: "nguyenvana@gmail.com",
        avatar: AVATAR_OPTIONS[0],
        category: "Tài khoản",
        subject: "Không đăng nhập được vào tài khoản",
        message:
            "Tôi không đăng nhập được vào tài khoản. Hệ thống báo lỗi mật khẩu mặc dù tôi đã nhập đúng. Đã thử đổi mật khẩu nhưng email reset chưa thấy gửi về.",
        createdAt: "2 phút trước",
        status: "Chưa xử lý",
        unread: true,
        device: "iOS 17.2",
        appVersion: "4.5.1",
        timeline: ["Ticket được tạo bởi Nguyễn Văn A", "Phân loại tự động: Lỗi đăng nhập"],
    },
    {
        id: 2,
        name: "Trần Thị B",
        email: "thibtran@example.com",
        avatar: AVATAR_OPTIONS[1],
        category: "Thanh toán",
        subject: "Thanh toán Premium bằng MoMo bị trừ tiền",
        message:
            "Tôi muốn nâng cấp lên gói Premium bằng ví điện tử MoMo nhưng bị lỗi trừ tiền mà chưa được kích hoạt tài khoản.",
        createdAt: "15 phút trước",
        status: "Đang xử lý",
        unread: true,
        device: "Android 14",
        appVersion: "4.5.1",
        timeline: ["Yêu cầu được chuyển đến bộ phận thanh toán", "Đang chờ xác minh giao dịch"],
    },
    {
        id: 3,
        name: "Lê Văn C",
        email: "levanc.it@gmail.com",
        avatar: AVATAR_OPTIONS[2],
        category: "Lỗi kỹ thuật",
        subject: "Âm thanh bài nghe bị gián đoạn",
        message:
            "Phần nghe trong bài học bị đứng ở giữa chừng trên trình duyệt Chrome. Tôi đã thử tải lại nhiều lần nhưng vẫn bị.",
        createdAt: "1 giờ trước",
        status: "Đã phản hồi",
        unread: false,
        device: "Windows 11 / Chrome",
        appVersion: "4.5.0",
        timeline: ["Ticket được phân loại tự động", "Đã gửi hướng dẫn khắc phục cho người dùng"],
    },
    {
        id: 4,
        name: "Hoàng Long",
        email: "h.long99@gmail.com",
        avatar: AVATAR_OPTIONS[3],
        category: "Nội dung học",
        subject: "Muốn xem lại bài đã hoàn thành",
        message:
            "Tôi muốn xem lại các bài đã hoàn thành để ôn tập nhưng không tìm được nút mở lại bài cũ.",
        createdAt: "3 giờ trước",
        status: "Chưa xử lý",
        unread: true,
        device: "iPhone 15",
        appVersion: "4.5.1",
        timeline: ["Ticket mới từ người dùng", "Chưa có phản hồi từ admin"],
    },
];

export const SUPPORT_STATUS_FILTERS: Array<"Tất cả" | SupportStatus> = ["Tất cả", "Chưa xử lý", "Đang xử lý", "Đã phản hồi"];
