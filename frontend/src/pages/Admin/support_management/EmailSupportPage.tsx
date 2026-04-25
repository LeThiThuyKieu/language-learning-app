import { useEffect, useMemo, useState } from "react";
import SupportStatsHeader from "@/components/admin/support_management/SupportStatsHeader.tsx";
import SupportThreadDetail from "@/components/admin/support_management/SupportThreadDetail.tsx";
import SupportThreadList from "@/components/admin/support_management/SupportThreadList.tsx";
import { SUPPORT_THREADS, type SupportStatus } from "@/components/admin/support_management/supportTypes.ts";

export default function EmailSupportPage() {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Tất cả" | SupportStatus>("Tất cả");
    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
    const [draftReply, setDraftReply] = useState("");

    const filteredThreads = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return SUPPORT_THREADS.filter((thread) => {
            const matchesQuery =
                !normalizedQuery ||
                thread.name.toLowerCase().includes(normalizedQuery) ||
                thread.email.toLowerCase().includes(normalizedQuery) ||
                thread.subject.toLowerCase().includes(normalizedQuery) ||
                thread.message.toLowerCase().includes(normalizedQuery);

            const matchesStatus = statusFilter === "Tất cả" || thread.status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [query, statusFilter]);

    const selectedThread = useMemo(
        () => filteredThreads.find((thread) => thread.id === selectedThreadId) ?? null,
        [filteredThreads, selectedThreadId],
    );

    useEffect(() => {
        if (selectedThreadId !== null && !filteredThreads.some((thread) => thread.id === selectedThreadId)) {
            setSelectedThreadId(null);
            setDraftReply("");
        }
    }, [filteredThreads, selectedThreadId]);

    useEffect(() => {
        if (selectedThread) {
            setDraftReply(`Chào ${selectedThread.name}, admin đã ghi nhận phản hồi của bạn.`);
        }
    }, [selectedThread]);

    const totalUnread = SUPPORT_THREADS.filter((thread) => thread.unread).length;
    const totalReplied = SUPPORT_THREADS.filter((thread) => thread.status === "Đã phản hồi").length;

    return (
        <div className="space-y-6">
            <SupportStatsHeader total={SUPPORT_THREADS.length} unread={totalUnread} replied={totalReplied} />

            <div className={selectedThread ? "grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]" : "space-y-6"}>
                <SupportThreadList
                    threads={filteredThreads}
                    selectedThreadId={selectedThreadId}
                    query={query}
                    statusFilter={statusFilter}
                    onQueryChange={setQuery}
                    onStatusFilterChange={setStatusFilter}
                    onSelectThread={setSelectedThreadId}
                />

                {selectedThread ? (
                    <SupportThreadDetail
                        thread={selectedThread}
                        replyDraft={draftReply}
                        onReplyDraftChange={setDraftReply}
                    />
                ) : null}
            </div>
        </div>
    );
}