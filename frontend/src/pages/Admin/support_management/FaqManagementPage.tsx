import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { HelpCircle, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";
import apiClient from "@/config/api";

interface FaqItem {
    id: number;
    question: string;
    answer: string[];
    displayOrder: number;
    status: "ACTIVE" | "INACTIVE";
    updatedAt: string;
}

type ApiResponse<T> = { success: boolean; message: string; data: T };

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
    return status === "ACTIVE" ? (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Inactive
        </span>
    );
}

/** Modal xem chi tiết 1 FAQ */
function ViewModal({ faq, onClose }: { faq: FaqItem; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-bold text-gray-900">Chi tiết FAQ #{faq.id}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400">
                        ✕
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">Thứ tự: {faq.displayOrder}</span>
                        <StatusBadge status={faq.status} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Câu hỏi</p>
                        <p className="text-sm font-bold text-gray-900">{faq.question}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Câu trả lời</p>
                        <ul className="space-y-1.5">
                            {faq.answer.map((line, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-600">
                                    <span className="text-orange-400 shrink-0">•</span>
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {faq.updatedAt && (
                        <p className="text-xs text-gray-400">Cập nhật lúc: {faq.updatedAt}</p>
                    )}
                </div>
                <div className="flex justify-end px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FaqManagementPage() {
    const [faqs, setFaqs]             = useState<FaqItem[]>([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [viewFaq, setViewFaq]       = useState<FaqItem | null>(null);
    const [filterStatus, setFilterStatus] = useState<"all" | "ACTIVE" | "INACTIVE">("all");
    const [search, setSearch]         = useState("");
    const [page, setPage]             = useState(1);

    useEffect(() => {
        apiClient.get<ApiResponse<FaqItem[]>>("/admin/faq")
            .then(res => setFaqs(res.data.data ?? []))
            .catch(() => toast.error("Không tải được danh sách FAQ"))
            .finally(() => setIsLoading(false));
    }, []);

    // Reset về trang 1 khi filter/search thay đổi
    useEffect(() => { setPage(1); }, [filterStatus, search]);

    const filtered = faqs.filter(f => {
        const matchStatus = filterStatus === "all" || f.status === filterStatus;
        const matchSearch = !search.trim() || f.question.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const activeCount = faqs.filter(f => f.status === "ACTIVE").length;
    const inactiveCount = faqs.filter(f => f.status === "INACTIVE").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">FAQ Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Danh sách câu hỏi thường gặp hiển thị trên trang Help của người dùng
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    {
                        label: "Tổng FAQ",
                        value: faqs.length.toLocaleString(),
                        icon: <HelpCircle size={24} />,
                        iconBg: "bg-gray-50",
                        iconText: "text-gray-900",
                        borderColor: "border-l-orange-500",
                    },
                    {
                        label: "Đang hiển thị",
                        value: activeCount.toLocaleString(),
                        icon: <HelpCircle size={24} />,
                        iconBg: "bg-emerald-50",
                        iconText: "text-emerald-700",
                        borderColor: "border-l-emerald-500",
                        change: "Số FAQ đang Active",
                        trend: "up" as const,
                    },
                    {
                        label: "Đã ẩn",
                        value: inactiveCount.toLocaleString(),
                        icon: <HelpCircle size={24} />,
                        iconBg: "bg-gray-50",
                        iconText: "text-gray-500",
                        borderColor: "border-l-gray-400",
                        change: "Số FAQ Inactive",
                        trend: "down" as const,
                    },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ].map(s => <AdminStatCard key={s.label} {...s as any} />)}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {(["all", "ACTIVE", "INACTIVE"] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={[
                            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                            filterStatus === f
                                ? "bg-primary-600 text-white shadow-sm"
                                : "bg-gray-100 text-slate-600 hover:bg-gray-200",
                        ].join(" ")}
                    >
                        {f === "all" ? "Tất cả" : f === "ACTIVE" ? "Active" : "Inactive"}
                    </button>
                ))}
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm câu hỏi..."
                    className="ml-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm outline-none focus:border-orange-300 focus:bg-white transition w-60"
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <HelpCircle className="w-10 h-10" />
                    <p className="text-sm">Không có FAQ nào</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {paginated.map(faq => (
                            <div
                                key={faq.id}
                                className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-all ${faq.status === "INACTIVE" ? "opacity-60" : ""} border-gray-100`}
                            >
                                {/* Top row: badges + actions */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                            Thứ tự: {faq.displayOrder}
                                        </span>
                                        <StatusBadge status={faq.status} />
                                    </div>
                                    {/* Chỉ có nút xem */}
                                    <button
                                        onClick={() => setViewFaq(faq)}
                                        title="Xem chi tiết"
                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-primary-600"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Question */}
                                <p className="text-sm font-bold text-gray-900 mb-1.5">{faq.question}</p>

                                {/* Answer preview (tất cả dòng) */}
                                <div className="text-sm text-gray-500 space-y-0.5">
                                    {faq.answer.map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>

                                {/* Updated at */}
                                {faq.updatedAt && (
                                    <p className="text-xs text-gray-400 mt-2">Cập nhật lúc: {faq.updatedAt}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                        <span>
                            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} của {filtered.length} câu hỏi
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={[
                                        "w-8 h-8 rounded-full text-xs font-semibold transition",
                                        p === page
                                            ? "bg-primary-600 text-white shadow-sm"
                                            : "hover:bg-gray-100 text-gray-600",
                                    ].join(" ")}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* View modal */}
            {viewFaq && <ViewModal faq={viewFaq} onClose={() => setViewFaq(null)} />}
        </div>
    );
}
