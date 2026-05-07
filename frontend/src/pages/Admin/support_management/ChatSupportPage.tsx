import { useRef, useState } from "react";
import {
    Search,
    MoreVertical,
    Paperclip,
    Image,
    Send,
    CheckCheck,
    Clock,
    AlertCircle,
    Filter,
    Inbox,
    User,
} from "lucide-react";

// ─── Mock Types ───────────────────────────────────────────────────────────────
type TicketStatus = "Đã phản hồi" | "Đang chờ" | "Khẩn cấp";
type MessageSender = "user" | "admin";

interface ChatMessage {
    id: number;
    sender: MessageSender;
    text: string;
    time: string;
    avatar?: string;
}

interface Ticket {
    id: number;
    ticketCode: string;
    subject: string;
    userName: string;
    userAvatar?: string;
    status: TicketStatus;
    timeAgo: string;
    messages: ChatMessage[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TICKETS: Ticket[] = [
    {
        id: 1,
        ticketCode: "#TK-9082",
        subject: "Lỗi giao dịch thanh toán QR",
        userName: "Yến Hương",
        status: "Đã phản hồi",
        timeAgo: "10 phút trước",
        messages: [
            {
                id: 1,
                sender: "user",
                text: "Tôi vừa thực hiện quét mã QR tại cửa hàng nhưng hệ thống báo lỗi không xác định. Tuy nhiên, tiền trong tài khoản của tôi đã bị trừ 250.000 VND. Vui lòng kiểm tra lại trang thái giao dịch giúp tôi. Tôi đã đính kèm ảnh chụp màn hình thông báo lỗi.",
                time: "15 phút trước",
            },
            {
                id: 2,
                sender: "admin",
                text: "Chào Yến Hương, admin đã ghi nhận phản hồi của bạn. Chúng tôi sẽ kiểm tra và phản hồi sớm nhất có thể.",
                time: "10 phút trước",
            },
        ],
    },
    {
        id: 2,
        ticketCode: "#TK-9081",
        subject: "Yêu cầu đổi mật khẩu",
        userName: "Trần Văn Tú",
        status: "Đang chờ",
        timeAgo: "1 giờ trước",
        messages: [
            {
                id: 1,
                sender: "user",
                text: "Tôi không thể đăng nhập vào tài khoản của mình. Tôi đã thử đặt lại mật khẩu nhưng không nhận được email xác nhận. Vui lòng hỗ trợ tôi.",
                time: "1 giờ trước",
            },
        ],
    },
    {
        id: 3,
        ticketCode: "#TK-9079",
        subject: "Tài khoản bị khóa vô cớ",
        userName: "Nguyễn Minh Anh",
        status: "Khẩn cấp",
        timeAgo: "3 giờ trước",
        messages: [
            {
                id: 1,
                sender: "user",
                text: "Tài khoản của tôi đột nhiên bị khóa mà không có thông báo gì. Tôi đang trong giữa một bài học quan trọng. Đây là lần thứ 3 xảy ra trong tuần này. Rất mong được hỗ trợ khẩn cấp!",
                time: "3 giờ trước",
            },
        ],
    },
    {
        id: 4,
        ticketCode: "#TK-9078",
        subject: "Không tải được bài học",
        userName: "Lê Thị Mai",
        status: "Đã phản hồi",
        timeAgo: "5 giờ trước",
        messages: [
            {
                id: 1,
                sender: "user",
                text: "Bài học Unit 5 không tải được, màn hình cứ quay vòng mãi. Tôi đã thử trên cả điện thoại và máy tính nhưng vẫn không được.",
                time: "5 giờ trước",
            },
            {
                id: 2,
                sender: "admin",
                text: "Chào Lê Thị Mai, chúng tôi đã ghi nhận vấn đề. Đội kỹ thuật đang kiểm tra và sẽ khắc phục trong vòng 24 giờ.",
                time: "4 giờ trước",
            },
        ],
    },
    {
        id: 5,
        ticketCode: "#TK-9077",
        subject: "Điểm XP không được cộng",
        userName: "Phạm Quốc Bảo",
        status: "Đang chờ",
        timeAgo: "1 ngày trước",
        messages: [
            {
                id: 1,
                sender: "user",
                text: "Tôi hoàn thành bài học nhưng điểm XP không được cộng vào tài khoản. Đã xảy ra 3 lần liên tiếp hôm nay.",
                time: "1 ngày trước",
            },
        ],
    },
];

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string; icon: React.ReactNode }> = {
    "Đã phản hồi": {
        label: "ĐÃ PHẢN HỒI",
        className: "bg-emerald-100 text-emerald-700",
        icon: <CheckCheck className="w-3 h-3" />,
    },
    "Đang chờ": {
        label: "ĐANG CHỜ",
        className: "bg-amber-100 text-amber-700",
        icon: <Clock className="w-3 h-3" />,
    },
    "Khẩn cấp": {
        label: "KHẨN CẤP",
        className: "bg-rose-100 text-rose-700",
        icon: <AlertCircle className="w-3 h-3" />,
    },
};

// ─── Avatar placeholder ────────────────────────────────────────────────────
function AvatarPlaceholder({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase();
    const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-11 h-11 text-base" : "w-9 h-9 text-sm";
    const colors = ["bg-orange-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400"];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
            {initials}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ChatSupportPage() {
    const [tickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [selectedId, setSelectedId] = useState<number | null>(1);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Tất cả" | TicketStatus>("Tất cả");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [messages, setMessages] = useState<Record<number, ChatMessage[]>>(
        Object.fromEntries(MOCK_TICKETS.map((t) => [t.id, t.messages]))
    );
    const [draft, setDraft] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;
    const currentMessages = selectedId ? (messages[selectedId] ?? []) : [];

    const filteredTickets = tickets.filter((t) => {
        const q = query.trim().toLowerCase();
        const matchQuery = !q || t.subject.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q) || t.ticketCode.toLowerCase().includes(q);
        const matchStatus = statusFilter === "Tất cả" || t.status === statusFilter;
        return matchQuery && matchStatus;
    });

    const handleSend = () => {
        if (!draft.trim() || !selectedId) return;
        const newMsg: ChatMessage = {
            id: Date.now(),
            sender: "admin",
            text: draft.trim(),
            time: "Vừa xong",
        };
        setMessages((prev) => ({
            ...prev,
            [selectedId]: [...(prev[selectedId] ?? []), newMsg],
        }));
        setDraft("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden">

            {/* ── Ticket List Panel ─────────────────────────────────────── */}
            <aside className="w-[300px] shrink-0 flex flex-col border-r border-gray-100 bg-white">

                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2.5 border border-gray-100">
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm kiếm ticket..."
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Filter bar */}
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        TẤT CẢ TICKET ({filteredTickets.length})
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu((v) => !v)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 transition"
                        >
                            <Filter className="w-3.5 h-3.5" />
                        </button>
                        {showFilterMenu && (
                            <div className="absolute right-0 top-6 z-20 bg-white border border-gray-100 rounded-2xl shadow-lg p-1.5 min-w-[140px]">
                                {(["Tất cả", "Đã phản hồi", "Đang chờ", "Khẩn cấp"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                                            statusFilter === s
                                                ? "bg-orange-50 text-orange-600"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket items */}
                <div className="flex-1 overflow-y-auto">
                    {filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-6">
                            <Inbox className="w-10 h-10" />
                            <p className="text-sm text-center">Không có ticket nào phù hợp</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => {
                            const isSelected = ticket.id === selectedId;
                            const cfg = STATUS_CONFIG[ticket.status];
                            const msgs = messages[ticket.id] ?? ticket.messages;
                            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedId(ticket.id)}
                                    className={`w-full text-left px-3 py-3.5 border-b border-gray-50 transition ${
                                        isSelected
                                            ? "bg-orange-50 border-l-2 border-l-orange-400"
                                            : "hover:bg-gray-50 border-l-2 border-l-transparent"
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <AvatarPlaceholder name={ticket.userName} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <p className="text-sm font-bold text-gray-900 truncate">{ticket.subject}</p>
                                                <span className="text-[10px] text-gray-400 shrink-0">{ticket.timeAgo}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1.5">{ticket.userName}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.className}`}>
                                                    {cfg.icon}
                                                    {cfg.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">{ticket.ticketCode}</span>
                                            </div>
                                            {lastMsg && (
                                                <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                                                    {lastMsg.sender === "admin" ? "Bạn: " : ""}{lastMsg.text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* ── Chat Panel ───────────────────────────────────────────── */}
            {selectedTicket ? (
                <div className="flex-1 flex flex-col bg-gray-50 min-w-0">

                    {/* Chat header */}
                    <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 shrink-0">
                        <AvatarPlaceholder name={selectedTicket.userName} size="lg" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-gray-900 truncate">{selectedTicket.subject}</h2>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_CONFIG[selectedTicket.status].className}`}>
                                    {STATUS_CONFIG[selectedTicket.status].icon}
                                    {STATUS_CONFIG[selectedTicket.status].label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Mã ticket: <span className="font-mono font-semibold text-gray-600">{selectedTicket.ticketCode}</span>
                                <span className="mx-1.5">·</span>
                                Gửi bởi: <span className="font-semibold text-gray-600">{selectedTicket.userName}</span>
                            </p>
                        </div>
                        <button className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                        {currentMessages.map((msg, idx) => {
                            const isAdmin = msg.sender === "admin";
                            const showDivider =
                                idx > 0 &&
                                currentMessages[idx - 1].sender !== msg.sender &&
                                msg.sender === "admin";

                            return (
                                <div key={msg.id}>
                                    {showDivider && (
                                        <div className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span className="text-[11px] text-gray-400 font-medium">Hội thoại hỗ trợ</span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                        </div>
                                    )}

                                    <div className={`flex items-end gap-2.5 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                                        {/* Avatar */}
                                        {!isAdmin ? (
                                            <AvatarPlaceholder name={selectedTicket.userName} size="sm" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        {/* Bubble */}
                                        <div className={`max-w-[68%] ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                            {!isAdmin && (
                                                <span className="text-xs font-semibold text-gray-600 ml-1">
                                                    {selectedTicket.userName}
                                                    <span className="ml-2 font-normal text-gray-400">{msg.time}</span>
                                                </span>
                                            )}
                                            {isAdmin && (
                                                <span className="text-xs font-normal text-gray-400 mr-1 text-right">
                                                    {msg.time} <span className="font-semibold text-orange-500">Nội dung đã phản hồi</span>
                                                </span>
                                            )}
                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                                isAdmin
                                                    ? "bg-white text-gray-800 rounded-br-sm shadow-sm border border-gray-100"
                                                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-3 shrink-0">
                        <div className="flex items-end gap-3">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-orange-300 focus-within:bg-white transition">
                                <textarea
                                    ref={textareaRef}
                                    value={draft}
                                    onChange={handleDraftChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập nội dung phản hồi tiếp theo..."
                                    rows={1}
                                    className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none placeholder:text-gray-400 leading-relaxed"
                                    style={{ maxHeight: 120 }}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!draft.trim()}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D84315] hover:bg-[#BF360C] text-white text-sm font-bold shadow-md shadow-orange-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                <Send className="w-4 h-4" />
                                Thêm phản hồi
                            </button>
                        </div>

                        {/* Bottom actions */}
                        <div className="flex items-center justify-between mt-2 px-1">
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition">
                                    <Paperclip className="w-3.5 h-3.5" />
                                    Đính kèm file
                                </button>
                                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition">
                                    <Image className="w-3.5 h-3.5" />
                                    Thêm ảnh
                                </button>
                            </div>
                            <span className="text-[11px] text-gray-400">
                                Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> để gửi
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-4 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-orange-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-gray-600">Chọn một ticket để bắt đầu</p>
                        <p className="text-sm mt-1">Chọn ticket từ danh sách bên trái để xem và phản hồi</p>
                    </div>
                </div>
            )}
        </div>
    );
}
