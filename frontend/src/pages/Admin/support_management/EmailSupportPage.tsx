import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import SupportStatsHeader from "@/components/admin/support_management/SupportStatsHeader.tsx";
import SupportThreadDetail from "@/components/admin/support_management/SupportThreadDetail.tsx";
import SupportThreadList from "@/components/admin/support_management/SupportThreadList.tsx";
import { type SupportStatus, type SupportThread } from "@/components/admin/support_management/supportTypes.ts";
import { supportService } from "@/services/supportService.ts";

export default function EmailSupportPage() {
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingReply, setIsSendingReply] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [timeSort, setTimeSort] = useState<"desc" | "asc">("desc");
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [draftReply, setDraftReply] = useState("");

    const filteredThreads = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        const matched = threads.filter((thread) => {
            const matchesQuery =
                !normalizedQuery ||
                thread.name.toLowerCase().includes(normalizedQuery) ||
                thread.email.toLowerCase().includes(normalizedQuery) ||
                thread.message.toLowerCase().includes(normalizedQuery);

            const matchesStatus = statusFilter === "Tất cả" || thread.status === statusFilter;

            return matchesQuery && matchesStatus;
        });

        return matched.sort((a, b) => {
            const aTime = new Date(a.sentAt).getTime();
            const bTime = new Date(b.sentAt).getTime();
            return timeSort === "desc" ? bTime - aTime : aTime - bTime;
        });
    }, [threads, query, statusFilter, timeSort]);

    const selectedThread = useMemo(
        () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
        [threads, selectedThreadId],
    );

    useEffect(() => {
        let mounted = true;
        const loadTickets = async () => {
            try {
                setIsLoading(true);
                const data = await supportService.getAdminTickets();
                if (mounted) {
                    setThreads(data);
                }
            } catch (error) {
                console.error("Không thể tải ticket hỗ trợ", error);
                toast.error("Không tải được danh sách hỗ trợ");
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadTickets();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (selectedThread) {
            setDraftReply(`Chào ${selectedThread.name}, admin đã ghi nhận phản hồi của bạn.`);
        }
    }, [selectedThread]);

    const totalUnread = threads.filter((thread) => thread.status === "Chưa xử lý").length;
    const totalReplied = threads.filter((thread) => thread.status === "Đã phản hồi").length;

    const handleSendReply = async () => {
        if (!selectedThread) return;
        if (!draftReply.trim()) {
            toast.error("Vui lòng nhập nội dung phản hồi");
            return;
        }

        try {
            setIsSendingReply(true);
            const updatedThread = await supportService.replyAdminTicket(selectedThread.id, draftReply);
            setThreads((prev) => prev.map((item) => (item.id === updatedThread.id ? updatedThread : item)));
            setDraftReply("");
            toast.success("Đã gửi phản hồi");
        } catch (error) {
            console.error("Gửi phản hồi thất bại", error);
            toast.error("Không thể gửi phản hồi");
        } finally {
            setIsSendingReply(false);
        }
    };

    return (
        <div className="space-y-6">
            <SupportStatsHeader total={threads.length} unread={totalUnread} replied={totalReplied} />

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
                    onSelectThread={setSelectedThreadId}
                />

                {selectedThread ? (
                    <SupportThreadDetail
                        thread={selectedThread}
                        replyDraft={draftReply}
                        onReplyDraftChange={setDraftReply}
                        onSendReply={handleSendReply}
                        isSendingReply={isSendingReply}
                    />
                ) : null}
            </div>
        </div>
    );
}