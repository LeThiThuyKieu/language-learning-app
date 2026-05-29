import { useEffect, useState } from "react";
import {
    Award,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Edit3,
    ImageIcon,
    Loader2,
    Plus,
    Search,
    Sparkles,
    ToggleRight,
    ToggleLeft,
    Users,
} from "lucide-react";

import toast from "react-hot-toast";
import AdminStatCard, { type AdminStatCardProps } from "@/components/admin/common/AdminStatCard";
import AddEditBadgeModal from "@/components/admin/badge_management/AddEditBadgeModal";
import { badgeManagementService, type AdminBadge, type BadgeStats, type BadgeUpsertPayload } from "@/services/admin/badgeManagementService";

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

function getBadgeStatusLabel(status: AdminBadge["status"]) {
    return status === "inactive" ? "Inactive" : "Active";
}

function getBadgeStatusStyles(status: AdminBadge["status"]) {
    return status === "inactive"
        ? "bg-slate-100 text-slate-600"
        : "bg-emerald-50 text-emerald-700";
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
    const [badgeModalOpen, setBadgeModalOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<AdminBadge | null>(null);

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

    function openAddBadgeModal() {
        setEditingBadge(null);
        setBadgeModalOpen(true);
    }

    function openEditBadgeModal(badge: AdminBadge) {
        setEditingBadge(badge);
        setBadgeModalOpen(true);
    }

    async function handleSaveBadge(payload: BadgeUpsertPayload) {
        try {
            if (editingBadge) {
                await badgeManagementService.updateBadge(editingBadge.id, payload);
                toast.success("Đã cập nhật badge");
            } else {
                await badgeManagementService.createBadge(payload);
                toast.success("Đã thêm badge mới");
            }

            setBadgeModalOpen(false);
            setEditingBadge(null);
            await fetchData(page, keyword);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể lưu badge";
            toast.error(message);
        }
    }

    const [togglingId, setTogglingId] = useState<number | null>(null);

    async function handleToggleBadgeStatus(badge: AdminBadge) {
        try {
            setTogglingId(badge.id);
            const nextStatus = badge.status === "inactive" ? "active" : "inactive";
            const updated = await badgeManagementService.updateBadge(badge.id, {
                badgeName: badge.badgeName,
                description: badge.description || "",
                requiredKn: badge.requiredKn,
                status: nextStatus,
            });

            // Update local list like ChatbotRulesPage — no toast, no full refetch
            setBadges((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        } catch (error) {
            // Fail silently like chatbot rules page; log for debugging
            console.error("Failed toggling badge status", error);
        } finally {
            setTogglingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Badge</h1>
                    <p className="mt-1 text-sm text-gray-500">Theo dõi badge của người dùng theo dạng card và thống kê sử dụng.</p>
                </div>
                <button
                    type="button"
                    onClick={openAddBadgeModal}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
                >
                    <Plus size={16} />
                    Thêm badge
                </button>
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
                            {badges.map((badge) => {
                                const badgeDescription = badge.description || `Hãy cố gắng đạt ${formatNumber(badge.requiredKn)} KN để nhận huy hiệu này!`;

                                return (
                                    <article key={badge.id} className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-lg">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100/80 ring-1 ring-slate-100">
                                                <div className="h-14 w-14 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200/70">
                                                    <BadgePreview badge={badge} />
                                                </div>
                                            </div>

                                            <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                                                {badge.requiredKn} KN
                                            </div>
                                        </div>

                                        <div className="mt-5 min-w-0">
                                            <h3 className="truncate text-xl font-extrabold leading-tight text-slate-900 group-hover:whitespace-normal group-hover:overflow-visible">
                                                {badge.badgeName}
                                            </h3>
                                            <p
                                                className="mt-2 max-h-[3.1rem] overflow-hidden text-sm leading-6 text-slate-500 transition-[max-height] duration-200 group-hover:max-h-96"
                                            >
                                                {badgeDescription}
                                            </p>
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
                                                <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${getBadgeStatusStyles(badge.status)}`}>
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    {getBadgeStatusLabel(badge.status)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => openEditBadgeModal(badge)}
                                                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                                Sửa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleToggleBadgeStatus(badge)}
                                                disabled={togglingId === badge.id}
                                                title={badge.status === "inactive" ? "Bật badge" : "Tắt badge"}
                                                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                            >
                                                {togglingId === badge.id
                                                    ? <Loader2 className="h-5 w-5 animate-spin" />
                                                    : badge.status === "active"
                                                        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                                        : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
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

            {badgeModalOpen && (
                <AddEditBadgeModal
                    mode={editingBadge ? "edit" : "add"}
                    badge={editingBadge}
                    onClose={() => {
                        setBadgeModalOpen(false);
                        setEditingBadge(null);
                    }}
                    onSubmit={handleSaveBadge}
                />
            )}
        </div>
    );
}
