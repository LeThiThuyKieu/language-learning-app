import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import ConfirmModal from "@/components/user/layout/ConfirmModal";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";
import { Crown } from "lucide-react";

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const { isAuthenticated, logout, user } = useAuthStore();
    const { entries, isLoading, error } = useLeaderboard(10);
    const [moreOpen, setMoreOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const orderedTopTen = Array.from({ length: 10 }, (_, idx) => {
        const rank = idx + 1;
        return entries.find((entry) => entry.rankPosition === rank) ?? null;
    });
    const topThree = orderedTopTen.slice(0, 3);
    const remaining = orderedTopTen.slice(3, 10);
    const meInTopTen = entries.find((entry) => entry.userId === user?.id) ?? null;

    if (!isAuthenticated) {
        return <GuestPrompt />;
    }

    return (
        <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
            <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
                <div className="grid grid-cols-12 gap-6">
                    <aside className="col-span-12 md:col-span-3 lg:col-span-3 md:border-r md:border-gray-200 md:pr-3 md:pl-0 lg:pr-6">
                        <div className="md:sticky md:top-24">
                            <nav className="mt-1 flex w-full max-w-[16.5rem] flex-col gap-1">
                                <SidebarItem
                                    label="Học"
                                    onClick={() => navigate("/learn")}
                                    icon={<img src="/icons/learn/hoc.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
                                />
                                <SidebarItem
                                    label="Bảng xếp hạng"
                                    active
                                    icon={<img src="/icons/learn/bxh.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
                                />
                                <SidebarItem
                                    label="Nhiệm vụ"
                                    icon={<img src="/icons/learn/task.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
                                />

                                <div className="relative w-full pt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setMoreOpen((v) => !v)}
                                        className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-transparent px-4 py-3 text-left text-gray-600 transition hover:bg-gray-100"
                                    >
                                        <span className="flex items-center gap-3">
                                            <img src="/icons/learn/more-info.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />
                                            <span className="text-sm font-semibold uppercase tracking-wide">Xem thêm</span>
                                        </span>
                                        <svg
                                            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>

                                    {moreOpen && (
                                        <div className="mt-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                                            <MoreItem label="Hồ sơ" onClick={() => navigate("/profile")} />
                                            <MoreItem label="Cài đặt" onClick={() => navigate("/settings")} />
                                            <MoreItem label="Đăng xuất" onClick={() => setShowLogoutConfirm(true)} />
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </div>
                    </aside>

                    <main className="col-span-12 md:col-span-9 lg:col-span-9">
                        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-primary-100 bg-white p-4 shadow-sm sm:p-6">
                            <div className="text-center">
                                <h1 className="text-3xl font-black text-primary-700">Bảng xếp hạng</h1>
                                <p className="mt-1 text-sm font-medium text-gray-500">10 người có tổng KN cao nhất</p>
                            </div>

                            {isLoading ? (
                                <div className="mt-8 space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                                    {error}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-[38px] mx-auto grid max-w-[340px] grid-cols-3 items-end gap-0">
                                        {[2, 1, 3].map((rank) => {
                                            const entry = topThree[rank - 1];
                                            const rankClass =
                                                rank === 1
                                                    ? "-translate-y-6"
                                                    : rank === 2
                                                        ? "translate-y-[2px] -translate-x-[40px]"
                                                        : "translate-y-[18px] translate-x-[40px]";
                                            const avatarClass =
                                                rank === 1
                                                    ? "h-24 w-24 ring-yellow-400 shadow-lg"
                                                    : rank === 2
                                                        ? "h-16 w-16 ring-slate-300"
                                                        : "h-14 w-14 ring-amber-600";

                                            if (!entry) {
                                                return (
                                                    <div key={`empty-${rank}`} className={`text-center ${rankClass}`}>
                                                        <div className={`mx-auto rounded-full ring-4 bg-gray-100 ${avatarClass}`} />
                                                        <div className="mt-2 text-xs font-extrabold text-gray-400">#{rank}</div>
                                                        <div className="text-sm font-bold text-gray-400">Chưa có</div>
                                                        <div className="mx-auto mt-1 inline-flex items-center rounded-xl bg-gray-200 px-3 py-1 text-xs font-black text-gray-500">0 KN</div>
                                                        <div className="text-[11px] font-semibold text-gray-400">0 XP</div>
                                                    </div>
                                                );
                                            }

                                            const isMe = user?.id === entry.userId;
                                            const meAvatarHighlight = isMe
                                                ? "ring-offset-2 ring-offset-white outline outline-2 outline-primary-400"
                                                : "";

                                            return (
                                                <div key={entry.userId} className={`text-center px-2 py-2 ${rankClass}`}>
                                                    <div className={`mx-auto overflow-hidden rounded-full ring-4 bg-white ${avatarClass} ${meAvatarHighlight}`}>
                                                        <img
                                                            src={entry.avatarUrl || DEFAULT_AVATAR_URL}
                                                            alt={entry.displayName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-xs font-extrabold text-gray-700">#{entry.rankPosition}</div>
                                                    <div className="truncate text-sm font-bold text-gray-900">{isMe ? "Bạn" : entry.displayName}</div>
                                                    <div className={`mx-auto mt-1 inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black text-white ${rank === 1 ? "bg-primary-600" : rank === 2 ? "bg-slate-500" : "bg-orange-500"}`}>
                                                        {rank === 1 && <Crown className="h-3 w-3" />} {entry.totalKn} KN
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-gray-500">{entry.totalXp} XP</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {meInTopTen && meInTopTen.rankPosition > 10 && (
                                        <div className="mt-8 rounded-2xl bg-primary-600 px-4 py-3 text-white">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold uppercase tracking-wide text-white/80">Hạng của bạn #{meInTopTen.rankPosition}</div>
                                                    <div className="truncate text-base font-black">{meInTopTen.displayName}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black">{meInTopTen.totalKn} KN</div>
                                                    <div className="text-[11px] font-semibold text-white/85">{meInTopTen.totalXp} XP</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6">
                                        <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.15em] text-gray-500">Top 10 hệ thống</div>
                                        <div className="space-y-2">
                                            {remaining.map((entry, idx) => {
                                                const isMe = !!entry && user?.id === entry.userId;

                                                return (
                                                <div
                                                    key={entry?.userId ?? `empty-row-${idx + 4}`}
                                                    className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 ${
                                                        isMe
                                                            ? "border-orange-300 bg-orange-50"
                                                            : "border-gray-100 bg-white"
                                                    }`}
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div
                                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                                                                isMe
                                                                    ? "bg-orange-100 text-orange-700"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}
                                                        >
                                                            {idx + 4}
                                                        </div>
                                                        {entry ? (
                                                            <>
                                                                <img
                                                                    src={entry.avatarUrl || DEFAULT_AVATAR_URL}
                                                                    alt={entry.displayName}
                                                                    className="h-9 w-9 rounded-full object-cover"
                                                                />
                                                                <div className="truncate text-sm font-bold text-gray-900">{isMe ? "Bạn" : entry.displayName}</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="h-9 w-9 rounded-full bg-gray-100" />
                                                                <div className="truncate text-sm font-bold text-gray-400">Chưa có người</div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-primary-700">{entry?.totalKn ?? 0} KN</div>
                                                        <div className="text-[11px] font-semibold text-gray-500">{entry?.totalXp ?? 0} XP</div>
                                                    </div>
                                                </div>
                                            );})}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => {
                    logout();
                    navigate("/login", { replace: true });
                    setShowLogoutConfirm(false);
                }}
                message="Bạn có chắc chắn muốn đăng xuất không?"
            />
        </div>
    );
}

function SidebarItem({
    label,
    active = false,
    icon,
    onClick,
}: {
    label: string;
    active?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
                active
                    ? "border-primary-300 bg-primary-50 font-bold text-primary-700 shadow-sm"
                    : "border-transparent font-semibold text-gray-600 hover:bg-gray-100"
            }`}
        >
            {icon && <span className="flex shrink-0 items-center justify-center">{icon}</span>}
            <span className="uppercase tracking-wide">{label}</span>
        </button>
    );
}

function MoreItem({ label, onClick }: { label: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition"
        >
            {label}
        </button>
    );
}
