import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Mail, CheckCircle, XCircle, AlertCircle, Clock, Loader2, Search, Filter, ArrowDown, ArrowUp } from "lucide-react";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import SupportThreadDetail from "@/components/admin/support_management/SupportThreadDetail";
import SupportThreadList from "@/components/admin/support_management/SupportThreadList";
import { type SupportStatus, type SupportThread, SUPPORT_STATUS_FILTERS, STATUS_LABEL } from "@/components/admin/support_management/supportTypes";
import { supportService } from "@/services/supportService";
import { useSupportSocket, useSupportListSocket } from "@/hooks/useSupportSocket";

/** Tính stat cards từ danh sách thread hiện tại */
function buildStats(threads: SupportThread[]): AdminStatCardProps[] {
    const total      = threads.length;
    const open       = threads.filter((t) => t.status === "OPEN").length;
    const inProgress = threads.filter((t) => t.status === "IN_PROGRESS").length;
    const resolved   = threads.filter((t) => t.status === "RESOLVED").length;
    const closed     = threads.filter((t) => t.status === "CLOSED").length;
    return [
        { label: "Tổng email",  value: total.toLocaleString(),      icon: <Mail size={24} />,        iconBg: "bg-orange-50",  iconText: "text-orange-500",  borderColor: "border-l-orange-500",  change: "Tổng yêu cầu hỗ trợ", trend: "up" as const },
        { label: "Open",        value: open.toLocaleString(),       icon: <AlertCircle size={24} />, iconBg: "bg-rose-50",    iconText: "text-rose-500",    borderColor: "border-l-rose-500",    change: "Cần xử lý ngay",       trend: open > 0 ? "down" as const : "up" as const },
        { label: "In Progress", value: inProgress.toLocaleString(), icon: <Clock size={24} />,       iconBg: "bg-amber-50",   iconText: "text-amber-500",   borderColor: "border-l-amber-500",   change: "Đang được xử lý",      pulsing: inProgress > 0 },
        { label: "Resolved",    value: resolved.toLocaleString(),   icon: <CheckCircle size={24} />, iconBg: "bg-emerald-50", iconText: "text-emerald-500", borderColor: "border-l-emerald-500", change: "Đã hoàn thành",         trend: "up" as const },
        { label: "Closed",      value: closed.toLocaleString(),     icon: <XCircle size={24} />,     iconBg: "bg-gray-50",    iconText: "text-gray-400",    borderColor: "border-l-gray-400",    change: "Đã đóng",               trend: "up" as const },
    ];
}

export default function EmailSupportPage() {
    const [threads, setThreads]               = useState<SupportThread[]>([]);
    const [isLoading, setIsLoading]           = useState(true);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [query, setQuery]                   = useState("");
    const [statusFilter, setStatusFilter]     = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [timeSort, setTimeSort]             = useState<"desc" | "asc">("desc");
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [draftReply, setDraftReply]         = useState("");
    // Mobile: true = đang xem detail panel
    const [mobileShowDetail, setMobileShowDetail] = useState(false);
    // Set id các ticket có tin nhắn mới chưa xem (admin đang ở detail khác)
    const [unreadIds, setUnreadIds] = useState<Set<number>>(new Set());

    const loadedIds = useRef<Set<number>>(new Set());
    // Ref để truy cập selectedThreadId mới nhất trong WS callback
    const selectedThreadIdRef = useRef<number | null>(null);
    selectedThreadIdRef.current = selectedThreadId;

    const stats = useMemo(() => buildStats(threads), [threads]);

    const filteredThreads = useMemo(() => {
        const q = query.trim().toLowerCase();
        return threads
            .filter((t) => {
                const matchQuery  = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
                const matchStatus = statusFilter === "Tất cả" || t.status === statusFilter;
                return matchQuery && matchStatus;
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

    /** WebSocket: nhận tin nhắn mới realtime (ticket đang xem) */
    useSupportSocket({
        ticketId: selectedThreadId,
        keepMessage: selectedThread?.message,
        onUpdate: (updated) => {
            const now = new Date().toISOString();
            setThreads((prev) =>
                prev
                    .map((t) => {
                        if (t.id !== updated.id) return t;
                        return { ...updated, message: t.message || updated.message, sentAt: now };
                    })
                    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
            );
            if (updated.id !== selectedThreadIdRef.current) {
                setUnreadIds((prev) => new Set(prev).add(updated.id));
            }
        },
    });

    /** WebSocket: nhận cập nhật danh sách (sort, status, preview) cho mọi ticket EMAIL */
    useSupportListSocket({
        onListUpdate: (item) => {
            if (item.source !== "EMAIL") return;
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
        supportService.getAdminTickets(0, 100, "desc", "EMAIL")
            .then((data) => { if (mounted) setThreads(data); })
            .catch(() => toast.error("Không tải được danh sách hỗ trợ"))
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    /** Tắt scroll của main khi ở trang này để 2 panel scroll độc lập */
    useEffect(() => {
        const main = document.querySelector("main");
        if (main) { main.style.overflow = "hidden"; }
        return () => { if (main) { main.style.overflow = ""; } };
    }, []);

    /** Chọn thread, chuyển OPEN → IN_PROGRESS, xóa unread */
    const handleSelectThread = (threadId: number) => {
        setSelectedThreadId(threadId);
        setMobileShowDetail(true);
        setUnreadIds((prev) => { const s = new Set(prev); s.delete(threadId); return s; });
        const thread = threads.find((t) => t.id === threadId);
        if (!thread) return;
        setDraftReply(`Chào ${thread.name}, admin đã ghi nhận phản hồi của bạn.`);

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

    /** Admin gửi phản hồi email */
    const handleSendReply = async () => {
        if (!selectedThread || !draftReply.trim()) { toast.error("Vui lòng nhập nội dung phản hồi"); return; }
        try {
            setIsSendingReply(true);
            const updated = await supportService.replyAdminTicket(selectedThread.id, draftReply);
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                return { ...t, messages: updated.messages, status: updated.status, message: updated.message || t.message };
            }));
            setDraftReply("");
            toast.success("Đã gửi phản hồi");
        } catch { toast.error("Không thể gửi phản hồi"); }
        finally { setIsSendingReply(false); }
    };

    return (
        <div className="flex flex-col -m-6 h-[calc(100vh-64px)] overflow-hidden">

            {/* Header + Stats — chỉ hiện trên md+, ẩn khi đang xem detail */}
            {!selectedThread && (
                <div className="hidden md:block px-6 pt-6 pb-4 space-y-5 shrink-0">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý email hỗ trợ</h1>
                        <p className="text-sm text-gray-500 mt-1">Xem nhanh danh sách yêu cầu, mở từng email để phản hồi, và theo dõi trạng thái xử lý ngay trong admin.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                        {stats.map((stat) => <AdminStatCard key={stat.label} {...stat} />)}
                    </div>
                    {isLoading && (
                        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-3 flex items-center gap-2 text-slate-500 text-sm shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải ticket hỗ trợ...
                        </div>
                    )}
                </div>
            )}

            {/* Layout chính */}
            <div className={`flex-1 overflow-hidden px-3 pb-3 md:px-6 md:pb-6 ${selectedThread ? "flex flex-col pt-3 lg:grid lg:gap-6 lg:pt-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:h-full" : "flex flex-col"}`}>

                {/* List panel:
                    - Mobile không có detail: hiện
                    - Mobile có detail đang xem: ẩn hoàn toàn
                    - Desktop: luôn hiện */}
                <div className={`flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ${mobileShowDetail && selectedThread ? "hidden lg:flex" : "flex"}`}>
                        <SupportThreadList
                            threads={filteredThreads}
                            selectedThreadId={selectedThreadId}
                            query={query}
                            statusFilter={statusFilter}
                            timeSort={timeSort}
                            isTwoColumn={Boolean(selectedThread)}
                            unreadIds={unreadIds}
                            onQueryChange={setQuery}
                            onStatusFilterChange={setStatusFilter}
                            onToggleTimeSort={() => setTimeSort((prev) => (prev === "desc" ? "asc" : "desc"))}
                            onSelectThread={handleSelectThread}
                        />
                    </div>

                {/* Detail panel:
                    - Mobile: chỉ hiện khi mobileShowDetail=true
                    - Desktop: luôn hiện khi có selectedThread */}
                {selectedThread && (
                    <div className={`${mobileShowDetail ? "flex" : "hidden"} flex-col h-full min-h-0 lg:flex pt-3 lg:pt-0`}>

                        {/* Filter bar ngoài khung — chỉ mobile, giống SupportThreadList header */}
                        <div className="lg:hidden shrink-0 space-y-3 mb-3">
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
                                    const showDot = f === "OPEN" && unreadIds.size > 0;
                                    return (
                                        <button
                                            key={f}
                                            onClick={() => { setStatusFilter(f); setMobileShowDetail(false); }}
                                            className={[
                                                "relative rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                                statusFilter === f
                                                    ? "bg-primary-600 text-white shadow-sm"
                                                    : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                                            ].join(" ")}
                                        >
                                            {f === "Tất cả" ? "Tất cả" : STATUS_LABEL[f]}
                                            {showDot && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setTimeSort((prev) => (prev === "desc" ? "asc" : "desc"))}
                                    className="ml-auto inline-flex gap-2 px-3 items-center rounded-full border border-gray-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                >
                                    <span>Theo thời gian</span>
                                    {timeSort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        <SupportThreadDetail
                            thread={selectedThread}
                            replyDraft={draftReply}
                            onReplyDraftChange={setDraftReply}
                            onSendReply={handleSendReply}
                            isSendingReply={isSendingReply}
                            onBack={() => setMobileShowDetail(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
