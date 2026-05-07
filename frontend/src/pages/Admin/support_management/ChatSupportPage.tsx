import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
    Search, Send, Inbox, User, MessageCircle, CheckCircle, Clock, AlertCircle,
    ArrowDown, ArrowUp, Filter, X, Loader2,
} from "lucide-react";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import { type SupportStatus, type SupportThread, SUPPORT_STATUS_FILTERS } from "@/components/admin/support_management/supportTypes";
import { supportService } from "@/services/supportService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<SupportStatus, string> = {
    "Chưa xử lý": "bg-rose-100 text-rose-700",
    "Đang xử lý":  "bg-amber-100 text-amber-700",
    "Đã phản hồi": "bg-emerald-100 text-emerald-700",
};

const CATEGORY_STYLE: Record<string, string> = {
    "Bắt đầu học": "bg-orange-100 text-orange-700",
    "Tài khoản":   "bg-blue-100 text-blue-700",
    "Thanh toán":  "bg-sky-100 text-sky-700",
    "Bài học":     "bg-emerald-100 text-emerald-700",
    "Kỹ thuật":    "bg-violet-100 text-violet-700",
    "Khác":        "bg-gray-100 text-gray-700",
};

function buildStats(threads: SupportThread[]): AdminStatCardProps[] {
    const total      = threads.length;
    const pending    = threads.filter((t) => t.status === "Chưa xử lý").length;
    const inProgress = threads.filter((t) => t.status === "Đang xử lý").length;
    const replied    = threads.filter((t) => t.status === "Đã phản hồi").length;
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
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [timeSort, setTimeSort] = useState<"desc" | "asc">("desc");
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [draftReply, setDraftReply] = useState("");

    const loadedIds = useRef<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const stats = useMemo(() => buildStats(threads), [threads]);

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
                return timeSort === "desc" ? -diff : diff;
            });
    }, [threads, query, statusFilter, timeSort]);

    const selectedThread = useMemo(
        () => threads.find((t) => t.id === selectedThreadId) ?? null,
        [threads, selectedThreadId],
    );

    // Load danh sách chat ticket (source=CHAT)
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        supportService.getAdminTickets(0, 100, "desc", "CHAT")
            .then((data) => { if (mounted) setThreads(data); })
            .catch(() => toast.error("Không tải được danh sách chat hỗ trợ"))
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    // Khi chọn ticket: load detail + chuyển OPEN → IN_PROGRESS
    const handleSelectThread = (threadId: number) => {
        setSelectedThreadId(threadId);
        const thread = threads.find((t) => t.id === threadId);
        if (!thread) return;

        setDraftReply(`Chào ${thread.name}, `);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

        if (loadedIds.current.has(threadId)) return;
        loadedIds.current.add(threadId);

        supportService.viewAdminTicket(threadId)
            .then((detail) => {
                setThreads((prev) => prev.map((t) => {
                    if (t.id !== detail.id) return t;
                    return { ...detail, message: t.message || detail.message };
                }));
            })
            .catch((err) => {
                console.error(err);
                loadedIds.current.delete(threadId);
            });
    };

    const handleSendReply = async () => {
        if (!selectedThread || !draftReply.trim()) {
            toast.error("Vui lòng nhập nội dung phản hồi");
            return;
        }
        try {
            setIsSendingReply(true);
            const updated = await supportService.replyAdminTicket(selectedThread.id, draftReply.trim());
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                return { ...updated, message: t.message || updated.message };
            }));
            setDraftReply("");
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            toast.success("Đã gửi phản hồi");
        } catch {
            toast.error("Không thể gửi phản hồi");
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendReply(); }
    };

    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftReply(e.target.value);
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

            {isLoading && (
                <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-slate-500 shadow-sm flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải...
                </div>
            )}

            {/* Content */}
            <div className={selectedThread ? "grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]" : "space-y-6"}>

                {/* ── Ticket List ── */}
                <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
                                className={`ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 ${selectedThread ? "px-2.5" : "gap-2 px-3"}`}
                            >
                                {!selectedThread && <span>Theo thời gian</span>}
                                {timeSort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {!isLoading && filteredThreads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                <Inbox className="w-10 h-10" />
                                <p className="text-sm">Không có ticket nào phù hợp</p>
                            </div>
                        ) : filteredThreads.map((thread) => {
                            const isSelected = thread.id === selectedThreadId;
                            const lastMsg = thread.messages && thread.messages.length > 0
                                ? thread.messages[thread.messages.length - 1]
                                : undefined;
                            return (
                                <button
                                    key={thread.id}
                                    onClick={() => handleSelectThread(thread.id)}
                                    className={`w-full text-left p-4 transition ${
                                        isSelected ? "bg-orange-50 border-l-4 border-l-orange-400" : "hover:bg-orange-50/40 border-l-4 border-l-transparent"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-900 truncate">{thread.name}</p>
                                        <span className="text-xs text-slate-400 shrink-0">{thread.createdAt}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">{thread.email}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_STYLE[thread.category] ?? "bg-gray-100 text-gray-700"}`}>
                                            {thread.category}
                                        </span>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[thread.status]}`}>
                                            {thread.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2 leading-6">
                                        {lastMsg ? (lastMsg.senderType === "ADMIN" ? "Bạn: " : "") + lastMsg.message : thread.message}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Chat Panel ── */}
                {selectedThread && (
                    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 280px)" }}>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                            <AvatarPlaceholder name={selectedThread.name} size="lg" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-sm font-bold text-gray-900 truncate">{selectedThread.category}</h2>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[selectedThread.status]}`}>
                                        {selectedThread.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {selectedThread.name}
                                    <span className="mx-1.5">·</span>
                                    {selectedThread.email}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedThreadId(null)}
                                className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {!selectedThread.messages ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                </div>
                            ) : selectedThread.messages.map((msg, idx) => {
                                const isAdmin = msg.senderType === "ADMIN";
                                const showDivider = idx > 0 && selectedThread.messages![idx - 1].senderType !== msg.senderType && isAdmin;
                                return (
                                    <div key={idx}>
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
                                                <AvatarPlaceholder name={selectedThread.name} size="sm" />
                                            )}
                                            <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                                                <span className="text-[11px] text-gray-400">
                                                    {isAdmin ? `Admin · ${msg.createdAt}` : `${selectedThread.name} · ${msg.createdAt}`}
                                                </span>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border border-gray-100 ${
                                                    isAdmin ? "bg-orange-50 rounded-br-sm" : "bg-white rounded-bl-sm"
                                                }`}>
                                                    {msg.message}
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
