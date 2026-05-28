import { useEffect, useState } from "react";
import {
    Award,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Edit3,
    ImageIcon,
    Loader2,
    Search,
    Sparkles,
    ToggleRight,
    Trash2,
    Users,
} from "lucide-react";

import toast from "react-hot-toast";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import { badgeManagementService, type AdminBadge, type BadgeStats } from "@/services/admin/badgeManagementService";

const DEFAULT_ICON = "/badges/badge_1.png";
const PAGE_SIZE = 8;

function formatNumber(value: number) {
    return value.toLocaleString("vi-VN");
}

function buildStats(stats: BadgeStats): AdminStatCardProps[] {
    return [
        {
            label: "Tổng badge",
            value: formatNumber(stats.totalBadges),
            icon: <BadgeCheck size={24} />,
            iconBg: "bg-orange-50",
            iconText: "text-orange-500",
            borderColor: "border-l-orange-500",
            change: "Badge đang hoạt động",
            trend: "up",
        },
        {
            label: "Tổng lượt trao",
            value: formatNumber(stats.totalAwards),
            icon: <Award size={24} />,
            iconBg: "bg-amber-50",
            iconText: "text-amber-500",
            borderColor: "border-l-amber-500",
            change: "Tổng badge user đã nhận",
            trend: "up",
        },
        {
            label: "Người dùng đạt",
            value: formatNumber(stats.uniqueEarners),
            icon: <Users size={24} />,
            iconBg: "bg-blue-50",
            iconText: "text-blue-500",
            borderColor: "border-l-blue-500",
            change: "User có ít nhất 1 badge",
            pulsing: true,
        }
    ];
}

function BadgePreview({ badge }: { badge: Pick<AdminBadge, "badgeName" | "iconUrl"> }) {
    const [src, setSrc] = useState(badge.iconUrl || DEFAULT_ICON);

    useEffect(() => {
        setSrc(badge.iconUrl || DEFAULT_ICON);
    }, [badge.iconUrl]);

    return <img src={src} alt={badge.badgeName} onError={() => setSrc(DEFAULT_ICON)} className="h-full w-full object-cover" />;
}

export default function BadgesManagementPage() {
    const [badges, setBadges] = useState<AdminBadge[]>([]);
    const [stats, setStats] = useState<AdminStatCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");

    async function fetchData(nextPage = 0, nextKeyword = keyword) {
        setLoading(true);
        try {
            const [badgeRes, statRes] = await Promise.all([
                badgeManagementService.getBadges(nextPage, PAGE_SIZE, nextKeyword),
                badgeManagementService.getStats(),
            ]);
            setBadges(badgeRes.badges);
            setPage(badgeRes.page);
            setTotalPages(Math.max(1, badgeRes.totalPages));
            setTotalItems(badgeRes.total);
            setStats(buildStats(statRes));
        } catch (error) {
            console.error("Lỗi tải badge:", error);
            toast.error("Không thể tải dữ liệu badge");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData(0, "");
    }, []);

    async function handleSearch() {
        const nextKeyword = keywordInput.trim();
        setKeyword(nextKeyword);
        await fetchData(0, nextKeyword);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Badge</h1>
                <p className="mt-1 text-sm text-gray-500">Theo dõi badge của người dùng theo dạng card và thống kê sử dụng.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-3">
                {stats.map((stat) => (
                    <AdminStatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Danh sách badge</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Hiển thị {badges.length} / {totalItems} badge theo bộ lọc hiện tại.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                value={keywordInput}
                                onChange={(event) => setKeywordInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        void handleSearch();
                                    }
                                }}
                                placeholder="Tìm theo tên / mô tả"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            onClick={() => void handleSearch()}
                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                            Tìm kiếm
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-slate-400">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang tải badge...
                        </div>
                    ) : badges.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                            <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
                            <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có badge nào</h3>
                            <p className="mt-2 text-sm text-slate-500">Không có badge nào khớp với bộ lọc hiện tại.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {badges.map((badge) => (
                                <article key={badge.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-lg">
                                    <div className="relative p-5">
                                        <div className="absolute right-4 top-4 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                                            {badge.requiredKn} KN
                                        </div>

                                        <div className="flex items-start gap-4 pr-16">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-100">
                                                <BadgePreview badge={badge} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-extrabold text-slate-900">{badge.badgeName}</h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                                    {badge.description || "Chưa có mô tả"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-2xl bg-slate-50 p-3">
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Người đạt
                                                </div>
                                                <div className="mt-1 text-lg font-extrabold text-slate-900">
                                                    {formatNumber(badge.recipientCount)}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-3">
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Trạng thái
                                                </div>
                                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    Active
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    
                                        
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Xóa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                                >
                                                    <ToggleRight className="h-3.5 w-3.5" />
                                                    Active
                                                </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {!loading && totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                        <div className="text-sm text-slate-500">
                            Trang <span className="font-bold text-slate-900">{page + 1}</span> / {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchData(Math.max(0, page - 1), keyword)}
                                disabled={page === 0}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Trước
                            </button>
                            <button
                                onClick={() => fetchData(Math.min(totalPages - 1, page + 1), keyword)}
                                disabled={page >= totalPages - 1}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Sau
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
