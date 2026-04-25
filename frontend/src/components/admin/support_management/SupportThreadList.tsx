import { ArrowDown, ArrowUp, Filter, Inbox, Search } from "lucide-react";
import { type SupportStatus, type SupportThread, SUPPORT_STATUS_FILTERS } from "./supportTypes.ts";

type SupportThreadListProps = {
    threads: SupportThread[];
    selectedThreadId: number | null;
    query: string;
    statusFilter: "Tất cả" | SupportStatus;
    timeSort: "desc" | "asc";
    isTwoColumn: boolean;
    onQueryChange: (value: string) => void;
    onStatusFilterChange: (value: "Tất cả" | SupportStatus) => void;
    onToggleTimeSort: () => void;
    onSelectThread: (threadId: number) => void;
};

const statusStyles: Record<SupportStatus, string> = {
    "Chưa xử lý": "bg-rose-100 text-rose-700",
    "Đang xử lý": "bg-amber-100 text-amber-700",
    "Đã phản hồi": "bg-emerald-100 text-emerald-700",
};

const categoryStyles: Record<SupportThread["category"], string> = {
    "Tài khoản": "bg-orange-100 text-orange-700",
    "Thanh toán": "bg-blue-100 text-blue-700",
    "Kỹ thuật": "bg-violet-100 text-violet-700",
    "Bắt đầu học": "bg-orange-100 text-orange-700",
    "Bài học": "bg-emerald-100 text-emerald-700",
    "Nội dung học": "bg-emerald-100 text-emerald-700",
    "Khác": "bg-gray-100 text-gray-700",
};

export default function SupportThreadList({
    threads,
    selectedThreadId,
    query,
    statusFilter,
    timeSort,
    isTwoColumn,
    onQueryChange,
    onStatusFilterChange,
    onToggleTimeSort,
    onSelectThread,
}: SupportThreadListProps) {
    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="space-y-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        placeholder="Search tickets..."
                        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    {SUPPORT_STATUS_FILTERS.map((filter) => {
                        const isActive = statusFilter === filter;

                        return (
                            <button
                                key={filter}
                                onClick={() => onStatusFilterChange(filter)}
                                className={[
                                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                    isActive
                                        ? "bg-primary-600 text-white shadow-sm"
                                        : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                                ].join(" ")}
                            >
                                {filter}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={onToggleTimeSort}
                        className={[
                            "ml-auto inline-flex items-center rounded-full border border-gray-200 bg-white py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700",
                            isTwoColumn ? "px-2.5" : "gap-2 px-3",
                        ].join(" ")}
                        title="Sắp xếp theo thời gian gửi"
                    >
                        {!isTwoColumn ? <span>Theo thời gian</span> : null}
                        {timeSort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {threads.length === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                        <Inbox className="h-12 w-12 text-gray-300" />
                        <h2 className="mt-4 text-lg font-bold text-gray-800">Không có tin nhắn nào</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Hiện không có email support phù hợp với bộ lọc hoặc từ khóa tìm kiếm.
                        </p>
                    </div>
                ) : (
                    threads.map((thread) => {
                        const isSelected = thread.id === selectedThreadId;

                        return (
                            <button
                                key={thread.id}
                                onClick={() => onSelectThread(thread.id)}
                                className={[
                                    "group w-full rounded-2xl border p-4 text-left transition",
                                    isSelected
                                        ? "border-orange-200 bg-orange-50 shadow-sm"
                                        : "border-gray-100 bg-white hover:border-orange-100 hover:bg-orange-50/40",
                                ].join(" ")}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="truncate text-sm font-bold text-slate-900">{thread.name}</p>
                                            <p className="truncate text-xs text-slate-400">{thread.email}</p>
                                        </div>
                                        <span className="shrink-0 text-xs font-medium text-slate-400">{thread.createdAt}</span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className={[
                                            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                            categoryStyles[thread.category],
                                        ].join(" ")}>{thread.category}</span>
                                        <span className={[
                                            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                            statusStyles[thread.status],
                                        ].join(" ")}>{thread.status}</span>
                                    </div>

                                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                                        {thread.message}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </section>
    );
}
