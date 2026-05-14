import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
    Search, Send, Inbox, User, MessageCircle, CheckCircle, Clock, AlertCircle,
    ArrowDown, ArrowUp, Filter, X, Loader2, XCircle,
} from "lucide-react";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import { type SupportStatus, type SupportThread, SUPPORT_STATUS_FILTERS, STATUS_LABEL, STATUS_STYLE } from "@/components/admin/support_management/supportTypes";
import { supportService } from "@/services/supportService";
import { useSupportSocket, useSupportListSocket } from "@/hooks/useSupportSocket";

/** Style badge màu cho từng category */
const CATEGORY_STYLE: Record<string, string> = {
    "Bắt đầu học": "bg-orange-100 text-orange-700",
    "Tài khoản":   "bg-blue-100 text-blue-700",
    "Thanh toán":  "bg-sky-100 text-sky-700",
    "Bài học":     "bg-emerald-100 text-emerald-700",
    "Kỹ thuật":    "bg-violet-100 text-violet-700",
    "Khác":        "bg-gray-100 text-gray-700",
};

/**
 * Tính toán các stat card từ danh sách thread hiện tại.
 * Đếm số lượng theo từng trạng thái để hiển thị ở header.
 */
function buildStats(threads: SupportThread[]): AdminStatCardProps[] {
    const total      = threads.length;
    const pending    = threads.filter((t) => t.status === "OPEN").length;
    const inProgress = threads.filter((t) => t.status === "IN_PROGRESS").length;
    const replied    = threads.filter((t) => t.status === "RESOLVED").length;
    const closed     = threads.filter((t) => t.status === "CLOSED").length;
    return [
        { label: "Tổng chat",   value: String(total),      icon: <MessageCircle size={24} />, iconBg: "bg-orange-50",  iconText: "text-orange-500",  borderColor: "border-l-orange-500",  change: "Tổng yêu cầu hỗ trợ", trend: "up" as const },
        { label: "Open",        value: String(pending),    icon: <AlertCircle size={24} />,   iconBg: "bg-rose-50",    iconText: "text-rose-500",    borderColor: "border-l-rose-500",    change: "Cần xử lý ngay",       trend: pending > 0 ? "down" as const : "up" as const },
        { label: "In Progress", value: String(inProgress), icon: <Clock size={24} />,         iconBg: "bg-amber-50",   iconText: "text-amber-500",   borderColor: "border-l-amber-500",   change: "Đang được xử lý",      pulsing: inProgress > 0 },
        { label: "Resolved",    value: String(replied),    icon: <CheckCircle size={24} />,   iconBg: "bg-emerald-50", iconText: "text-emerald-500", borderColor: "border-l-emerald-500", change: "Đã hoàn thành",         trend: "up" as const },
        { label: "Closed",      value: String(closed),     icon: <XCircle size={24} />,       iconBg: "bg-gray-50",    iconText: "text-gray-400",    borderColor: "border-l-gray-400",    change: "Đã đóng",               trend: "up" as const },
    ];
}

/**
 * Avatar placeholder hiển thị 2 chữ cái đầu của tên.
 * Màu nền được chọn dựa trên charCode của ký tự đầu tiên.
 */
function AvatarPlaceholder({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
    const sz       = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-10 h-10 text-sm" : "w-9 h-9 text-sm";
    const colors   = ["bg-orange-400", "bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-rose-400"];
    return (
        <div className={`${sz} ${colors[name.charCodeAt(0) % colors.length]} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
            {initials}
        </div>
    );
}

export default function ChatSupportPage() {
    const [threads, setThreads]               = useState<SupportThread[]>([]);
    const [isLoading, setIsLoading]           = useState(true);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [isResolving, setIsResolving]       = useState(false);
    const [query, setQuery]                   = useState("");
    const [statusFilter, setStatusFilter]     = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [timeSort, setTimeSort]             = useState<"desc" | "asc">("desc");
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [draftReply, setDraftReply]         = useState("");
    // Mobile: true = đang xem chat panel, false = đang xem list panel
    const [mobileShowChat, setMobileShowChat] = useState(false);
    // Set id các ticket có tin nhắn mới chưa xem
    const [unreadIds, setUnreadIds] = useState<Set<number>>(new Set());

    const loadedIds     = useRef<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef   = useRef<HTMLTextAreaElement>(null);
    // Ref để truy cập selectedThreadId mới nhất trong WS callback
    const selectedThreadIdRef = useRef<number | null>(null);
    selectedThreadIdRef.current = selectedThreadId;

    /** Tính stat cards từ danh sách thread hiện tại */
    const stats = useMemo(() => buildStats(threads), [threads]);

    /** Lọc và sắp xếp danh sách thread theo query, status filter và thời gian */
    const filteredThreads = useMemo(() => {
        const q = query.trim().toLowerCase();
        return threads
            .filter((t) => {
                const matchQ = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
                const matchS = statusFilter === "Tất cả" || t.status === statusFilter;
                return matchQ && matchS;
            })
            .sort((a, b) => {
                const diff = new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
                return timeSort === "desc" ? -diff : diff; // desc = mới nhất lên đầu
            });
    }, [threads, query, statusFilter, timeSort]);

    /** Thread đang được chọn để xem chi tiết */
    const selectedThread = useMemo(
        () => threads.find((t) => t.id === selectedThreadId) ?? null,
        [threads, selectedThreadId],
    );

    /** WebSocket: nhận tin nhắn realtime từ user (ticket đang xem) */
    useSupportSocket({
        ticketId: selectedThreadId,
        keepMessage: selectedThread?.message,
        onUpdate: (updated) => {
            // Chỉ cập nhật messages + status của ticket đang xem, KHÔNG đụng sentAt
            // (sentAt được useSupportListSocket xử lý để tránh double-update)
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                return { ...t, messages: updated.messages, status: updated.status };
            }));
        },
    });

    /** WebSocket: nhận cập nhật danh sách (sort, status, preview) cho mọi ticket CHAT */
    useSupportListSocket({
        onListUpdate: (item) => {
            if (item.source !== "CHAT") return;
            const now = new Date().toISOString();
            setThreads((prev) => {
                const exists = prev.find((t) => t.id === item.id);
                if (!exists) {
                    // Ticket mới toanh → thêm vào đầu danh sách
                    const newThread: SupportThread = {
                        id:        item.id,
                        userId:    null,
                        name:      item.requesterName || item.requesterEmail?.split("@")[0] || "Người dùng",
                        email:     item.requesterEmail,
                        category:  item.categoryDisplayName as SupportThread["category"],
                        message:   item.latestMessage,
                        createdAt: "Vừa xong",
                        sentAt:    now,
                        status:    item.status,
                    };
                    return [newThread, ...prev];
                }
                return prev
                    .map((t) => {
                        if (t.id !== item.id) return t;
                        return { ...t, status: item.status, message: item.latestMessage || t.message, sentAt: now };
                    })
                    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            });
            if (item.id !== selectedThreadIdRef.current) {
                setUnreadIds((prev) => new Set(prev).add(item.id));
            }
        },
    });

    /** Load danh sách ticket lần đầu khi mount — không poll, WS xử lý realtime */
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        supportService.getAdminTickets(0, 100, "desc", "CHAT")
            .then((data) => { if (mounted) setThreads(data); })
            .catch(() => toast.error("Không tải được danh sách chat hỗ trợ"))
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    /**
     * Ẩn overflow của thẻ main khi ở trang này để 2 panel (list + chat)
     * có thể scroll độc lập mà không bị ảnh hưởng bởi layout cha.
     */
    useEffect(() => {
        const main = document.querySelector("main");
        if (main) { main.style.overflow = "hidden"; }
        return () => { if (main) { main.style.overflow = ""; } };
    }, []);

    /**
     * Chọn một thread để xem chi tiết:
     * - Set draft reply mặc định với tên user
     * - Gọi viewAdminTicket lần đầu để chuyển OPEN → IN_PROGRESS (chỉ gọi 1 lần/ticket)
     */
    const handleSelectThread = (threadId: number) => {
        setSelectedThreadId(threadId);
        setMobileShowChat(true);
        setUnreadIds((prev) => { const s = new Set(prev); s.delete(threadId); return s; });
        const thread = threads.find((t) => t.id === threadId);
        if (!thread) return;
        setDraftReply(`Chào ${thread.name}, `);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

        // Optimistic: đổi OPEN → IN_PROGRESS ngay lập tức, không chờ API
        if (thread.status === "OPEN") {
            setThreads((prev) => prev.map((t) =>
                t.id === threadId ? { ...t, status: "IN_PROGRESS" } : t
            ));
        }

        if (loadedIds.current.has(threadId)) return;
        loadedIds.current.add(threadId);
        supportService.viewAdminTicket(threadId)
            .then((detail) => {
                // Chỉ cập nhật messages và status, giữ nguyên sentAt
                setThreads((prev) => prev.map((t) => {
                    if (t.id !== detail.id) return t;
                    return { ...t, messages: detail.messages, status: detail.status };
                }));
            })
            .catch(() => { loadedIds.current.delete(threadId); });
    };

    /** Admin gửi phản hồi vào ticket đang chọn */
    const handleSendReply = async () => {
        if (!selectedThread || !draftReply.trim()) { toast.error("Vui lòng nhập nội dung phản hồi"); return; }
        try {
            setIsSendingReply(true);
            const updated = await supportService.replyAdminTicket(selectedThread.id, draftReply.trim());
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                // Giữ sentAt hiện tại, chỉ cập nhật messages và status
                return { ...t, messages: updated.messages, status: updated.status, message: updated.message || t.message };
            }));
            setDraftReply("");
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            toast.success("Đã gửi phản hồi");
        } catch { toast.error("Không thể gửi phản hồi"); }
        finally { setIsSendingReply(false); }
    };

    /** Enter gửi reply, Shift+Enter xuống dòng */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendReply(); }
    };

    /** Đánh dấu ticket hiện tại là RESOLVED */
    const handleResolve = async () => {
        if (!selectedThread || isResolving) return;
        try {
            setIsResolving(true);
            const updated = await supportService.updateTicketStatus(selectedThread.id, "RESOLVED");
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                return { ...t, status: updated.status };
            }));
            toast.success("Đã đánh dấu hoàn tất");
        } catch (err) {
            console.error("[handleResolve] error:", err);
            toast.error("Không thể cập nhật trạng thái");
        } finally { setIsResolving(false); }
    };

    /** Tự động resize textarea theo nội dung, tối đa 120px */
    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftReply(e.target.value);
        const el = textareaRef.current;
        if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }
    };

    return (
        <div className="flex flex-col -m-6 h-[calc(100vh-64px)] overflow-hidden">

            {/* Header + Stats — chỉ hiện trên md trở lên, ẩn khi đang xem chi tiết */}
            {!selectedThread && (
                <div className="hidden md:block px-6 pt-6 pb-4 space-y-5 shrink-0">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý chat hỗ trợ</h1>
                        <p className="text-sm text-gray-500 mt-1">Xem và phản hồi trực tiếp các yêu cầu hỗ trợ qua chat.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                        {stats.map((s) => <AdminStatCard key={s.label} {...s} />)}
                    </div>
                    {isLoading && (
                        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-3 flex items-center gap-2 text-slate-500 text-sm shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                        </div>
                    )}
                </div>
            )}

            {/* Layout chính */}
            <div className={`flex-1 overflow-hidden px-3 pb-3 md:px-6 md:pb-6 ${selectedThread ? "lg:grid lg:gap-6 lg:pt-4 lg:grid-cols-[380px_minmax(0,1fr)]" : "flex flex-col"}`}>

                {/* List panel — ẩn trên mobile khi đang xem chat, luôn hiện trên desktop */}
                <div className={`flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ${mobileShowChat && selectedThread ? "hidden lg:flex" : "flex"}`}>

                    {/* Thanh tìm kiếm và filter */}
                    <div className="p-4 space-y-3 border-b border-gray-100 shrink-0">
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
                            {SUPPORT_STATUS_FILTERS.map((f) => {
                                // Hiện chấm đỏ trên filter "Open" nếu có unread
                                const showDot = f === "OPEN" && unreadIds.size > 0;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setStatusFilter(f)}
                                        className={`relative rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === f ? "bg-primary-600 text-white shadow-sm" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}
                                    >
                                        {f === "Tất cả" ? "Tất cả" : STATUS_LABEL[f]}
                                        {showDot && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setTimeSort((p) => p === "desc" ? "asc" : "desc")}
                                className="ml-auto inline-flex gap-2 px-3 items-center rounded-full border border-gray-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                            >
                                <span>Theo thời gian</span>
                                {timeSort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Danh sách thread */}
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {!isLoading && filteredThreads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-16">
                                <Inbox className="w-10 h-10" />
                                <p className="text-sm">Không có ticket nào phù hợp</p>
                            </div>
                        ) : filteredThreads.map((thread) => {
                            const isSelected = thread.id === selectedThreadId;
                            const hasUnread  = unreadIds.has(thread.id);
                            // Lấy tin nhắn mới nhất, bỏ qua auto-reply tĩnh
                            const realMsgs = (thread.messages ?? []).filter((m) => m.message !== "Cảm ơn bạn đã liên hệ hỗ trợ 💬 Yêu cầu của bạn đã được gửi thành công. Admin sẽ phản hồi trong thời gian sớm nhất. Vui lòng chờ trong giây lát nhé!");
                            const lastMsg  = realMsgs.length > 0 ? realMsgs[realMsgs.length - 1] : undefined;
                            return (
                                <button
                                    key={thread.id}
                                    onClick={() => handleSelectThread(thread.id)}
                                    className={`w-full text-left p-4 transition ${isSelected ? "bg-orange-50 border-l-4 border-l-orange-400" : "hover:bg-orange-50/40 border-l-4 border-l-transparent"}`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{thread.name}</p>
                                            {hasUnread && (
                                                <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0">{thread.createdAt}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">{thread.email}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_STYLE[thread.category] ?? "bg-gray-100 text-gray-700"}`}>
                                            {thread.category}
                                        </span>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[thread.status]}`}>
                                            {STATUS_LABEL[thread.status]}
                                        </span>
                                    </div>
                                    <p className={`text-sm line-clamp-2 leading-6 ${hasUnread ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                                        {lastMsg ? (lastMsg.senderType === "ADMIN" ? "Bạn: " : lastMsg.senderType === "BOT" ? "🤖 " : "") + lastMsg.message : thread.message}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat panel — hiện trên mobile khi mobileShowChat=true, luôn hiện trên desktop */}
                {selectedThread && (
                    <section className={`rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden h-full
                        ${mobileShowChat ? "flex" : "hidden lg:flex"}`}>

                        {/* Mini filter bar — chỉ hiện trên mobile khi đang xem chat */}
                        <div className="lg:hidden flex items-center gap-2 px-3 pt-3 pb-0 shrink-0 flex-wrap">
                            <button
                                onClick={() => setMobileShowChat(false)}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 shrink-0"
                            >
                                <ArrowUp className="w-4 h-4 rotate-[-90deg]" />
                            </button>
                            {SUPPORT_STATUS_FILTERS.map((f) => {
                                const showDot = f === "OPEN" && unreadIds.size > 0;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => { setStatusFilter(f); setMobileShowChat(false); }}
                                        className={`relative rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${statusFilter === f ? "bg-primary-600 text-white" : "bg-gray-100 text-slate-600"}`}
                                    >
                                        {f === "Tất cả" ? "Tất cả" : STATUS_LABEL[f]}
                                        {showDot && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                            {unreadIds.size > 0 && (
                                <span className="ml-auto text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                                    {unreadIds.size} tin mới
                                </span>
                            )}
                        </div>

                        {/* Header: info user + Hoàn tất + đóng (desktop) */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                            <AvatarPlaceholder name={selectedThread.name} size="lg" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-gray-900 truncate">{selectedThread.category}</h2>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[selectedThread.status]}`}>
                                        {STATUS_LABEL[selectedThread.status]}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {selectedThread.name}<span className="mx-1.5">·</span>{selectedThread.email}
                                </p>
                            </div>
                            {(selectedThread.status === "OPEN" || selectedThread.status === "IN_PROGRESS") && (
                                <button
                                    onClick={() => void handleResolve()}
                                    disabled={isResolving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition disabled:opacity-50 shrink-0"
                                >
                                    {isResolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    Hoàn tất
                                </button>
                            )}
                            {/* Nút đóng — chỉ hiện trên desktop */}
                            <button
                                onClick={() => { setSelectedThreadId(null); setMobileShowChat(false); }}
                                className="hidden lg:block p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Vùng hiển thị hội thoại */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {!selectedThread.messages ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                </div>
                            ) : selectedThread.messages.map((msg, idx) => {
                                const isAdmin = msg.senderType === "ADMIN";
                                const isBot   = msg.senderType === "BOT";
                                const isUser  = msg.senderType === "USER";

                                if (isUser) return (
                                    <div key={idx} className="flex items-end gap-2 flex-row">
                                        <AvatarPlaceholder name={selectedThread.name} size="sm" />
                                        <div className="max-w-[70%] flex flex-col gap-1 items-start">
                                            <span className="text-[11px] text-gray-400">{selectedThread.name} · {msg.createdAt}</span>
                                            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border border-gray-100 bg-white rounded-bl-sm">
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );

                                if (isBot) return (
                                    <div key={idx} className="flex items-end gap-2 flex-row">
                                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M5 14v7"/><path d="M19 14v7"/><path d="M9 18h6"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/></svg>
                                        </div>
                                        <div className="max-w-[70%] flex flex-col gap-1 items-start">
                                            <span className="text-[11px] text-gray-400">Bot · {msg.createdAt}</span>
                                            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border border-primary-100 bg-primary-50 rounded-bl-sm whitespace-pre-line">
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );

                                if (isAdmin) return (
                                    <div key={idx} className="flex items-end gap-2 flex-row-reverse">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                                            <User className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="max-w-[70%] flex flex-col gap-1 items-end">
                                            <span className="text-[11px] text-gray-400">Admin · {msg.createdAt}</span>
                                            <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border border-gray-100 bg-orange-50 rounded-br-sm">
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );

                                return null;
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input phản hồi */}
                        <div className="px-4 pt-3 pb-4 border-t border-gray-100 shrink-0">
                            <div className="flex items-end gap-3">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-orange-300 focus-within:bg-white transition">
                                    <textarea
                                        ref={textareaRef}
                                        value={draftReply}
                                        onChange={handleDraftChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nhập nội dung phản hồi..."
                                        rows={1}
                                        className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none overflow-hidden placeholder:text-gray-400 leading-relaxed"
                                        style={{ maxHeight: 120 }}
                                    />
                                </div>
                                <button
                                    onClick={() => void handleSendReply()}
                                    disabled={!draftReply.trim() || isSendingReply}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D84315] hover:bg-[#BF360C] text-white text-sm font-bold shadow-md shadow-orange-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Gửi
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
