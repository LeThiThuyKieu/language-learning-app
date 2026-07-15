import { Eye, Filter, RefreshCw, ChevronLeft, ChevronRight, Loader2, Headphones, BookOpen } from "lucide-react";
import type { ExamProgressSummary } from "@/services/admin/examProgressService";

const PAGE_SIZE = 10;

function ScoreBadge({ value }: { value: number | null | undefined }) {
    if (value == null) return <span className="text-gray-300 text-xs">—</span>;
    const color =
        value >= 80 ? "bg-emerald-100 text-emerald-700" :
        value >= 60 ? "bg-blue-100 text-blue-700" :
        value >= 40 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-600";
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
            {value.toFixed(1)}%
        </span>
    );
}

interface Props {
    users: ExamProgressSummary[];
    total: number;
    page: number;
    loading: boolean;
    search: string;
    onSearchChange: (v: string) => void;
    onViewDetail: (userId: number) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
}

export default function ExamProgressTable({
    users, total, page, loading,
    search, onSearchChange,
    onViewDetail, onPageChange, onRefresh,
}: Props) {
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Tìm theo tên, email..."
                        className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                    />
                </div>
                <button
                    onClick={onRefresh}
                    title="Làm mới"
                    className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-colors ml-auto"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Đang tải...</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                        <span className="text-4xl">🎓</span>
                        <p className="text-sm font-medium">Chưa có dữ liệu thi</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">#</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Người dùng</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Lượt thi</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                                    <span className="flex items-center justify-center gap-1">
                                        <Headphones className="w-3 h-3" />Listening
                                    </span>
                                </th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                                    <span className="flex items-center justify-center gap-1">
                                        <BookOpen className="w-3 h-3" />R&amp;W
                                    </span>
                                </th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Writing AI</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Speaking AI</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Lần cuối</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((u, idx) => (
                                <tr key={u.userId} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">
                                        {page * PAGE_SIZE + idx + 1}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center shrink-0">
                                                {u.avatarUrl
                                                    ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    : <span className="text-orange-500 font-bold text-xs">
                                                        {(u.fullName || u.email)[0].toUpperCase()}
                                                      </span>
                                                }
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm leading-tight">
                                                    {u.fullName || <span className="text-gray-400 italic">Chưa đặt tên</span>}
                                                </p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="font-bold text-gray-800">{u.totalAttempts}</span>
                                    </td>
                                    {/* TB Listening — câu có đáp án chuẩn */}
                                    <td className="px-4 py-3.5 text-center">
                                        <ScoreBadge value={u.avgListeningAccuracy} />
                                    </td>
                                    {/* TB R&W objective — câu có đáp án chuẩn, không tính SHORT_WRITE */}
                                    <td className="px-4 py-3.5 text-center">
                                        <ScoreBadge value={u.avgRwAccuracy} />
                                    </td>
                                    {/* Writing AI — LLM score */}
                                    <td className="px-4 py-3.5 text-center">
                                        <ScoreBadge value={u.avgWritingScore} />
                                    </td>
                                    {/* Speaking AI — LLM score */}
                                    <td className="px-4 py-3.5 text-center">
                                        <ScoreBadge value={u.avgSpeakingScore} />
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                                        {u.lastAttemptAt ?? "—"}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            onClick={() => onViewDetail(u.userId)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} người dùng
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onPageChange(page - 1)}
                                disabled={page === 0}
                                className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-medium text-gray-600 px-2">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => onPageChange(page + 1)}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-orange-500 hover:border-orange-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
