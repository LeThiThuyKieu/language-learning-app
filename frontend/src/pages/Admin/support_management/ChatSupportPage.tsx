import { useMemo, useRef, useState } from "react";
import {
    Search, Send, Inbox, User, MessageCircle, CheckCircle, Clock, AlertCircle,
    ArrowDown, ArrowUp, Filter, Paperclip, Image, X,
} from "lucide-react";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import { type SupportStatus, SUPPORT_STATUS_FILTERS } from "@/components/admin/support_management/supportTypes";

// ─── Types ────────────────────────────────────────────────────────────────────
type MessageSender = "USER" | "ADMIN";

interface ChatMessage {
    id: number;
    sender: MessageSender;
    text: string;
    createdAt: string;
}

interface ChatTicket {
    id: number;
    ticketCode: string;
    subject: string;
    userName: string;
    email: string;
    category: string;
    status: SupportStatus;
    timeAgo: string;
    sentAt: string;
    messages: ChatMessage[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TICKETS: ChatTicket[] = [
    {
        id: 1, ticketCode: "#TK-9082", subject: "Lỗi giao dịch thanh toán QR",
        userName: "Yến Hương", email: "yenhuong@gmail.com", category: "Thanh toán",
        status: "Đã phản hồi", timeAgo: "10 phút trước", sentAt: "2025-05-07T10:00:00",
        messages: [
            { id: 1, sender: "USER", text: "Tôi vừa thực hiện quét mã QR tại cửa hàng nhưng hệ thống báo lỗi không xác định. Tiền trong tài khoản đã bị trừ 250.000 VND. Vui lòng kiểm tra giúp tôi.", createdAt: "15 phút trước" },
            { id: 2, sender: "ADMIN", text: "Chào Yến Hương, admin đã ghi nhận phản hồi của bạn. Chúng tôi sẽ kiểm tra và phản hồi sớm nhất có thể.", createdAt: "10 phút trước" },
        ],
    },
    {
        id: 2, ticketCode: "#TK-9081", subject: "Yêu cầu đổi mật khẩu",
        userName: "Trần Văn Tú", email: "tranvantu@gmail.com", category: "Tài khoản",
        status: "Đang xử lý", timeAgo: "1 giờ trước", sentAt: "2025-05-07T09:00:00",
        messages: [
            { id: 1, sender: "USER", text: "Tôi không thể đăng nhập vào tài khoản. Đã thử đặt lại mật khẩu nhưng không nhận được email xác nhận.", createdAt: "1 giờ trước" },
        ],
    },
    {
        id: 3, ticketCode: "#TK-9079", subject: "Tài khoản bị khóa vô cớ",
        userName: "Nguyễn Minh Anh", email: "minhanh@gmail.com", category: "Tài khoản",
        status: "Chưa xử lý", timeAgo: "3 giờ trước", sentAt: "2025-05-07T07:00:00",
        messages: [
            { id: 1, sender: "USER", text: "Tài khoản của tôi đột nhiên bị khóa mà không có thông báo. Đây là lần thứ 3 xảy ra trong tuần này. Rất mong được hỗ trợ khẩn cấp!", createdAt: "3 giờ trước" },
        ],
    },
    {
        id: 4, ticketCode: "#TK-9078", subject: "Không tải được bài học",
        userName: "Lê Thị Mai", email: "letmai@gmail.com", category: "Bài học",
        status: "Đã phản hồi", timeAgo: "5 giờ trước", sentAt: "2025-05-07T05:00:00",
        messages: [
            { id: 1, sender: "USER", text: "Bài học Unit 5 không tải được, màn hình cứ quay vòng mãi. Đã thử trên cả điện thoại và máy tính.", createdAt: "5 giờ trước" },
            { id: 2, sender: "ADMIN", text: "Chào Lê Thị Mai, đội kỹ thuật đang kiểm tra và sẽ khắc phục trong vòng 24 giờ.", createdAt: "4 giờ trước" },
        ],
    },
    {
        id: 5, ticketCode: "#TK-9077", subject: "Điểm XP không được cộng",
        userName: "Phạm Quốc Bảo", email: "quocbao@gmail.com", category: "Bài học",
        status: "Chưa xử lý", timeAgo: "1 ngày trước", sentAt: "2025-05-06T10:00:00",
        messages: [
            { id: 1, sender: "USER", text: "Tôi hoàn thành bài học nhưng điểm XP không được cộng vào tài khoản. Đã xảy ra 3 lần liên tiếp hôm nay.", createdAt: "1 ngày trước" },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<SupportStatus, string> = {
    "Chưa xử lý": "bg-rose-100 text-rose-700",
    "Đang xử lý":  "bg-amber-100 text-amber-700",
    "Đã phản hồi": "bg-emerald-100 text-emerald-700",
};

const CATEGORY_STYLE: Record<string, string> = {
    "Tài khoản": "bg-orange-100 text-orange-700",
    "Thanh toán": "bg-blue-100 text-blue-700",
    "Kỹ thuật":   "bg-violet-100 text-violet-700",
    "Bài học":    "bg-emerald-100 text-emerald-700",
    "Khác":       "bg-gray-100 text-gray-700",
};

function buildStats(tickets: ChatTicket[]): AdminStatCardProps[] {
    const total      = tickets.length;
    const pending    = tickets.filter((t) => t.status === "Chưa xử lý").length;
    const inProgress = tickets.filter((t) => t.status === "Đang xử lý").length;
    const replied    = tickets.filter((t) => t.status === "Đã phản hồi").length;
    return [
        { label: "Tổng chat",    value: String(total),      icon: <MessageCircle size={24} />, iconBg: "bg-orange-50",  iconText: "text-orange-500",  borderColor: "border-l-orange-500",  change: "Tổng yêu cầu hỗ trợ", trend: "up" as const },
        { label: "Chưa xử lý",  value: String(pending),    icon: <AlertCircle size={24} />,   iconBg: "bg-rose-50",    iconText: "text-rose-500",    borderColor: "border-l-rose-500",    change: "Cần xử lý ngay",       trend: pending > 0 ? "down" as const : "up" as const },
        { label: "Đang xử lý",  value: String(inProgress), icon: <Clock size={24} />,         iconBg: "bg-amber-50",   iconText: "text-amber-500",   borderColor: "border-l-amber-500",   change: "Đang được xử lý",      pulsing: inProgress > 0 },
        { label: "Đã phản hồi", value: String(replied),    icon: <CheckCircle size={24} />,   iconBg: "bg-emerald-50", iconText: "text-emerald-500", borderColor: "border-l-emerald-500", change: "Đã hoàn thành",         trend: "up" as const },
    ];
}

function AvatarPlaceholder({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
    const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-10 h-10 text-sm" : "w-9 h-9 text-sm";
    const colors = ["bg-orange-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400"];
    return (
        <div className={`${sz} ${colors[name.charCodeAt(0) % colors.length]} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
            {initials}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChatSupportPage() {
    const [tickets, setTickets] = useState<ChatTicket[]>(MOCK_TICKETS);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [timeSort, setTimeSort] = useState<"desc" | "asc">("desc");
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const stats = useMemo(() => buildStats(tickets), [tickets]);

    const filteredTickets = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tickets
            .filter((t) => {
                const matchQ = !q || t.subject.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
                const matchS = statusFilter === "Tất cả" || t.status === statusFilter;
                return matchQ && matchS;
            })
            .sort((a, b) => {
                const diff = new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
                return timeSort === "desc" ? -diff : diff;
            });
    }, [tickets, query, statusFilter, timeSort]);

    const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId]);

    const handleSelectTicket = (id: number) => {
        setSelectedId(id);
        const t = tickets.find((x) => x.id === id);
        if (t) setDraft(`Chào ${t.userName}, `);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const handleSend = () => {
        if (!draft.trim() || !selectedId) return;
        setIsSending(true);

        const newMsg: ChatMessage = {
            id: Date.now(),
            sender: "ADMIN",
            text: draft.trim(),
            createdAt: "Vừa xong",
        };

        setTickets((prev) => prev.map((t) => {
            if (t.id !== selectedId) return t;
            return {
                ...t,
                status: "Đã phản hồi" as SupportStatus,
                messages: [...t.messages, newMsg],
            };
        }));

        setDraft("");
        setIsSending(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        const el = textareaRef.current;
        if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Quản lý chat hỗ trợ</h1>
                <p className="text-sm text-gray-500 mt-1">Xem và phản hồi trực tiếp các yêu cầu hỗ trợ qua chat.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s) => <AdminStatCard key={s.label} {...s} />)}
            </div>

            {/* Content: list + optional chatbox */}
            <div className={selectedTicket ? "grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]" : "space-y-6"}>

                {/* ── Ticket List ── */}
                <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    {/* Search + filter */}
                    <div className="p-4 space-y-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                            <Search className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search tickets..."
                                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />
                            {SUPPORT_STATUS_FILTERS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                        statusFilter === f ? "bg-primary-600 text-white shadow-sm" : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                            <button
                                onClick={() => setTimeSort((p) => p === "desc" ? "asc" : "desc")}
                                className={`ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 ${selectedTicket ? "px-2.5" : "gap-2 px-3"}`}
                            >
                                {!selectedTicket && <span>Theo thời gian</span>}
                                {timeSort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Ticket items */}
                    <div className="divide-y divide-gray-50">
                        {filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                <Inbox className="w-10 h-10" />
                                <p className="text-sm">Không có ticket nào phù hợp</p>
                            </div>
                        ) : filteredTickets.map((ticket) => {
                            const isSelected = ticket.id === selectedId;
                            const lastMsg = ticket.messages[ticket.messages.length - 1];
                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket.id)}
                                    className={`w-full text-left p-4 transition group ${
                                        isSelected ? "bg-orange-50 border-l-4 border-l-orange-400" : "hover:bg-orange-50/40 border-l-4 border-l-transparent"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-900 truncate">{ticket.userName}</p>
                                        <span className="text-xs text-slate-400 shrink-0">{ticket.timeAgo}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">{ticket.email}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_STYLE[ticket.category] ?? "bg-gray-100 text-gray-700"}`}>
                                            {ticket.category}
                                        </span>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    {lastMsg && (
                                        <p className="text-sm text-slate-600 line-clamp-2 leading-6">
                                            {lastMsg.sender === "ADMIN" ? "Bạn: " : ""}{lastMsg.text}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Chat Panel ── */}
                {selectedTicket && (
                    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 280px)" }}>
                        {/* Chat header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                            <AvatarPlaceholder name={selectedTicket.userName} size="lg" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-gray-900 truncate">{selectedTicket.subject}</h2>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[selectedTicket.status]}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    <span className="font-mono font-semibold text-gray-600">{selectedTicket.ticketCode}</span>
                                    <span className="mx-1.5">·</span>
                                    {selectedTicket.userName}
                                    <span className="mx-1.5">·</span>
                                    {selectedTicket.email}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {selectedTicket.messages.map((msg, idx) => {
                                const isAdmin = msg.sender === "ADMIN";
                                const showDivider = idx > 0 && selectedTicket.messages[idx - 1].sender !== msg.sender && isAdmin;
                                return (
                                    <div key={msg.id}>
                                        {showDivider && (
                                            <div className="flex items-center gap-3 my-3">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-[11px] text-gray-400">Phản hồi từ admin</span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>
                                        )}
                                        <div className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                                            {isAdmin ? (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            ) : (
                                                <AvatarPlaceholder name={selectedTicket.userName} size="sm" />
                                            )}
                                            <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                                                <span className="text-[11px] text-gray-400">
                                                    {isAdmin ? `Admin · ${msg.createdAt}` : `${selectedTicket.userName} · ${msg.createdAt}`}
                                                </span>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border border-gray-100 ${
                                                    isAdmin ? "bg-orange-50 rounded-br-sm" : "bg-white rounded-bl-sm"
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

                        {/* Input */}
                        <div className="px-4 pt-3 pb-4 border-t border-gray-100 shrink-0">
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
                                    disabled={!draft.trim() || isSending}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D84315] hover:bg-[#BF360C] text-white text-sm font-bold shadow-md shadow-orange-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                    Gửi
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2 px-1">
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition">
                                        <Paperclip className="w-3.5 h-3.5" /> Đính kèm
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition">
                                        <Image className="w-3.5 h-3.5" /> Ảnh
                                    </button>
                                </div>
                                <span className="text-[11px] text-gray-400">
                                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> để gửi
                                </span>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
