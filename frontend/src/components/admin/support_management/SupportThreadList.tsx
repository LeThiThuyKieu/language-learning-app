import { ArrowDown, ArrowUp, Filter, Inbox, Search } from "lucide-react";
import { type SupportStatus, type SupportThread, SUPPORT_STATUS_FILTERS, STATUS_LABEL, STATUS_STYLE } from "./supportTypes.ts";

type SupportThreadListProps = {
    threads: SupportThread[];
    selectedThreadId: number | null;
    query: string;
    statusFilter: "Tất cả" | SupportStatus;
    timeSort: "desc" | "asc";
    isTwoColumn: boolean;
    unreadIds?: Set<number>; // ticket có tin nhắn mới chưa xem
    onQueryChange: (value: string) => void;
    onStatusFilterChange: (value: "Tất cả" | SupportStatus) => void;
    onToggleTimeSort: () => void;
    onSelectThread: (threadId: number) => void;
};

const CATEGORY_STYLE: Record<string, string> = {
    "Bắt đầu học":  "bg-orange-100 text-orange-700",
    "Tài khoản":    "bg-blue-100 text-blue-700",
    "Thanh toán":   "bg-sky-100 text-sky-700",
    "Bài học":      "bg-emerald-100 text-emerald-700",
    "Kỹ thuật":     "bg-violet-100 text-violet-700",
    "Nội dung học": "bg-emerald-100 text-emerald-700",
    "Khác":         "bg-gray-100 text-gray-700",
};

export default function SupportThreadList({
    threads,
    selectedThreadId,
    query,
    statusFilter,
    timeSort,
    isTwoColumn,
    unreadIds,
    onQueryChange,
    onStatusFilterChange,
    onToggleTimeSort,
    onSelectThread,
}: SupportThreadListProps) {
    return (
        /* Component này được đặt trong container flex-col overflow-hidden từ parent */
        <>
            {/* Search + filter — không scroll */}
            <div className="p-4 space-y-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Search tickets..."
                        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    {SUPPORT_STATUS_FILTERS.map((filter) => {
                        const showDot = filter === "OPEN" && (unreadIds?.size ?? 0) > 0;
                        return (
                            <button
                                key={filter}
                                onClick={() => onStatusFilterChange(filter)}
                                className={[
                                    "relative rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                    statusFilter === filter
                                        ? "bg-primary-600 text-white shadow-sm"
                                        : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                                ].join(" ")}
                            >
                                {filter === "Tất cả" ? "Tất cả" : STATUS_LABEL[filter]}
                                {showDot && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={onToggleTimeSort}
                        className="ml-auto inline-flex gap-2 px-3 items-center rounded-full border border-gray-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                        <span>Theo thời gian</span>
                        {timeSort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            {/* Ticket items — scroll bên trong */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-16">
                        <Inbox className="h-10 w-10" />
                        <p className="text-sm">Không có ticket nào phù hợp</p>
                    </div>
                ) : threads.map((thread) => {
                    const isSelected = thread.id === selectedThreadId;
                    const hasUnread  = unreadIds?.has(thread.id) ?? false;
                    return (
                        <button
                            key={thread.id}
                            onClick={() => onSelectThread(thread.id)}
                            className={`w-full text-left p-4 transition ${
                                isSelected
                                    ? "bg-orange-50 border-l-4 border-l-orange-400"
                                    : "hover:bg-orange-50/40 border-l-4 border-l-transparent"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{thread.name}</p>
                                    {/* Dot đỏ báo tin nhắn mới chưa xem */}
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
                                {thread.message}
                            </p>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
