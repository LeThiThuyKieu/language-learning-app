import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Mail, CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import SupportThreadDetail from "@/components/admin/support_management/SupportThreadDetail";
import SupportThreadList from "@/components/admin/support_management/SupportThreadList";
import { type SupportStatus, type SupportThread } from "@/components/admin/support_management/supportTypes";
import { supportService } from "@/services/supportService";

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
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [timeSort, setTimeSort] = useState<"desc" | "asc">("desc");
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [draftReply, setDraftReply] = useState("");
    const loadedIds = useRef<Set<number>>(new Set());

    const stats = useMemo(() => buildStats(threads), [threads]);

    const filteredThreads = useMemo(() => {
        const q = query.trim().toLowerCase();
        return threads
            .filter((t) => {
                const matchQuery = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
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

    useEffect(() => {
        let mounted = true;
        const fetchList = () => {
            supportService.getAdminTickets(0, 100, "desc", "EMAIL")
                .then((data) => {
                    if (!mounted) return;
                    setThreads((prev) => {
                        const prevMap = new Map(prev.map((t) => [t.id, t]));
                        return data.map((t) => {
                            const existing = prevMap.get(t.id);
                            return existing?.messages ? { ...t, messages: existing.messages } : t;
                        });
                    });
                })
                .catch(() => {});
        };
        setIsLoading(true);
        supportService.getAdminTickets(0, 100, "desc", "EMAIL")
            .then((data) => { if (mounted) setThreads(data); })
            .catch(() => toast.error("Không tải được danh sách hỗ trợ"))
            .finally(() => { if (mounted) setIsLoading(false); });
        const listPoll = setInterval(fetchList, 15_000);
        return () => { mounted = false; clearInterval(listPoll); };
    }, []);

    const handleSelectThread = (threadId: number) => {
        setSelectedThreadId(threadId);
        const thread = threads.find((t) => t.id === threadId);
        if (!thread) return;
        setDraftReply(`Chào ${thread.name}, admin đã ghi nhận phản hồi của bạn.`);
        if (loadedIds.current.has(threadId)) return;
        loadedIds.current.add(threadId);
        supportService.viewAdminTicket(threadId)
            .then((detail) => {
                setThreads((prev) => prev.map((t) => {
                    if (t.id !== detail.id) return t;
                    return { ...detail, message: t.message || detail.message };
                }));
            })
            .catch(() => { loadedIds.current.delete(threadId); });
    };

    const handleSendReply = async () => {
        if (!selectedThread || !draftReply.trim()) { toast.error("Vui lòng nhập nội dung phản hồi"); return; }
        try {
            setIsSendingReply(true);
            const updated = await supportService.replyAdminTicket(selectedThread.id, draftReply);
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                return { ...updated, message: t.message || updated.message };
            }));
            setDraftReply("");
            toast.success("Đã gửi phản hồi");
        } catch { toast.error("Không thể gửi phản hồi"); }
        finally { setIsSendingReply(false); }
    };

    // Tắt scroll của main khi ở trang này để 2 panel scroll độc lập
    useEffect(() => {
        const main = document.querySelector("main");
        if (main) { main.style.overflow = "hidden"; }
        return () => { if (main) { main.style.overflow = ""; } };
    }, []);

    return (
        <div className="flex flex-col -m-6 h-[calc(100vh-64px)] overflow-hidden">

            {/* Header + Stats — ẩn khi đang xem detail */}
            {!selectedThread && (
            <div className="px-6 pt-6 pb-4 space-y-5 shrink-0">
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

            {/* List + Detail — chiếm phần còn lại, scroll độc lập */}
            <div className={`flex-1 overflow-hidden px-6 pb-6 ${selectedThread ? "grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]" : "flex flex-col"}`}>

                {/* List panel — scroll bên trong */}
                <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <SupportThreadList
                        threads={filteredThreads}
                        selectedThreadId={selectedThreadId}
                        query={query}
                        statusFilter={statusFilter}
                        timeSort={timeSort}
                        isTwoColumn={Boolean(selectedThread)}
                        onQueryChange={setQuery}
                        onStatusFilterChange={setStatusFilter}
                        onToggleTimeSort={() => setTimeSort((prev) => (prev === "desc" ? "asc" : "desc"))}
                        onSelectThread={handleSelectThread}
                    />
                </div>

                {/* Detail panel — scroll bên trong */}
                {selectedThread && (
                    <SupportThreadDetail
                        thread={selectedThread}
                        replyDraft={draftReply}
                        onReplyDraftChange={setDraftReply}
                        onSendReply={handleSendReply}
                        isSendingReply={isSendingReply}
                    />
                )}
            </div>
        </div>
    );
}
