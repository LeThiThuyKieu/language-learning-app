import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Mail, Inbox, MessageSquare, CheckCircle } from "lucide-react";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import SupportThreadDetail from "@/components/admin/support_management/SupportThreadDetail";
import SupportThreadList from "@/components/admin/support_management/SupportThreadList";
import { type SupportStatus, type SupportThread } from "@/components/admin/support_management/supportTypes";
import { supportService } from "@/services/supportService";

function buildStats(threads: SupportThread[]): AdminStatCardProps[] {
    const total = threads.length;
    const open = threads.filter((t) => t.status === "Chưa xử lý").length;
    const inProgress = threads.filter((t) => t.status === "Đang xử lý").length;
    const replied = threads.filter((t) => t.status === "Đã phản hồi").length;

    return [
        { label: "Tổng email",    value: total.toLocaleString(),      icon: <Mail size={24} />,         iconBg: "bg-orange-50",  iconText: "text-orange-500",  borderColor: "border-l-orange-500",  change: "Tổng yêu cầu hỗ trợ", trend: "up" as const },
        { label: "Chưa xử lý",   value: open.toLocaleString(),       icon: <Inbox size={24} />,        iconBg: "bg-rose-50",    iconText: "text-rose-500",    borderColor: "border-l-rose-500",    change: "Cần xử lý ngay",       trend: open > 0 ? "down" as const : "up" as const },
        { label: "Đang xử lý",   value: inProgress.toLocaleString(), icon: <MessageSquare size={24} />,iconBg: "bg-amber-50",   iconText: "text-amber-500",   borderColor: "border-l-amber-500",   change: "Đang được xử lý",      pulsing: inProgress > 0 },
        { label: "Đã phản hồi",  value: replied.toLocaleString(),    icon: <CheckCircle size={24} />,  iconBg: "bg-emerald-50", iconText: "text-emerald-500", borderColor: "border-l-emerald-500", change: "Đã hoàn thành",         trend: "up" as const },
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

    // Ref để tránh gọi API trùng lặp
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

    // Load danh sách ticket lần đầu
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        supportService.getAdminTickets()
            .then((data) => { if (mounted) setThreads(data); })
            .catch(() => toast.error("Không tải được danh sách hỗ trợ"))
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    // Khi chọn ticket: load detail 1 lần duy nhất (dùng ref để guard)
    const handleSelectThread = (threadId: number) => {
        setSelectedThreadId(threadId);

        const thread = threads.find((t) => t.id === threadId);
        if (!thread) return;

        // Set draft ngay
        setDraftReply(`Chào ${thread.name}, admin đã ghi nhận phản hồi của bạn.`);

        // Nếu đã load rồi thì thôi
        if (loadedIds.current.has(threadId)) return;
        loadedIds.current.add(threadId);

        supportService.viewAdminTicket(threadId)
            .then((detail) => {
                setThreads((prev) => prev.map((t) => {
                    if (t.id !== detail.id) return t;
                    // Giữ message gốc từ list (câu hỏi user), chỉ merge messages[] và status mới
                    return { ...detail, message: t.message || detail.message };
                }));
            })
            .catch((err) => {
                console.error(err);
                // Nếu lỗi thì xóa khỏi set để có thể retry
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
            const updated = await supportService.replyAdminTicket(selectedThread.id, draftReply);
            setThreads((prev) => prev.map((t) => {
                if (t.id !== updated.id) return t;
                // Giữ message gốc (câu hỏi user), cập nhật messages[] và status mới
                return { ...updated, message: t.message || updated.message };
            }));
            setDraftReply("");
            toast.success("Đã gửi phản hồi");
        } catch {
            toast.error("Không thể gửi phản hồi");
        } finally {
            setIsSendingReply(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Quản lý email hỗ trợ</h1>
                <p className="text-sm text-gray-500 mt-1">Xem nhanh danh sách yêu cầu, mở từng email để phản hồi, và theo dõi trạng thái xử lý ngay trong admin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat) => (
                    <AdminStatCard key={stat.label} {...stat} />
                ))}
            </div>

            {isLoading ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Đang tải ticket hỗ trợ...
                </div>
            ) : null}

            <div className={selectedThread ? "grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]" : "space-y-6"}>
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
