import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { LeaderboardPeriod } from "@/services/leaderboardService";
import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";
import { Crown } from "lucide-react";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const { isAuthenticated, logout, user } = useAuthStore();
    const [period, setPeriod] = useState<LeaderboardPeriod>("WEEK");
    const { entries, isLoading, error } = useLeaderboard(10, period);

    const scoreLabel = "KN";
    const subtitle =
        period === "WEEK"
            ? "Top 10 tuần này (theo KN)"
            : period === "MONTH"
                ? "Top 10 tháng này (theo KN)"
                : "Top 10 tổng (theo KN)";

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
        <div className="relative left-1/2 right-1/2 min-h-screen w-screen -translate-x-1/2 bg-white -mt-8">
            <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
                <div className="grid grid-cols-12 gap-6">
                    <LearnSidebar
                        isAllLevelsCompleted={false}
                        showGeneralRevision={false}
                        onToggleGeneralRevision={() => navigate("/general-revision")}
                        activeItem="leaderboard"
                        onNavigate={(path) => navigate(path)}
                        onLogout={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    />

                    <main className="col-span-12 md:col-span-9 lg:col-span-9">
                        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-primary-100 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
                            <div className="text-center">
                                <h1 className="text-3xl font-black text-primary-700">Bảng xếp hạng</h1>
                                <p className="mt-2 text-sm font-medium text-gray-500">{subtitle}</p>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <div className="inline-flex gap-1 rounded-2xl bg-gray-100 p-1.5">
                                    {([
                                        { key: "WEEK", label: "Tuần" },
                                        { key: "MONTH", label: "Tháng" },
                                        { key: "ALL", label: "Tổng" },
                                    ] as const).map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => setPeriod(item.key)}
                                            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                                                period === item.key
                                                    ? "bg-white text-primary-700 shadow-sm"
                                                    : "text-gray-600 hover:text-gray-800"
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="mt-8 space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-100" />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                                    {error}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-12 mx-auto grid max-w-[420px] grid-cols-3 items-end gap-4">
                                        {[2, 1, 3].map((rank) => {
                                            const entry = topThree[rank - 1];

                                            const rankClass =
                                                rank === 1
                                                    ? "-translate-y-8"
                                                    : rank === 2
                                                        ? "translate-y-2 -translate-x-4"
                                                        : "translate-y-4 translate-x-4";

                                            const avatarClass =
                                                rank === 1
                                                    ? "h-28 w-28 ring-yellow-400 shadow-lg"
                                                    : rank === 2
                                                        ? "h-20 w-20 ring-slate-300"
                                                        : "h-20 w-20 ring-amber-600";

                                            if (!entry) {
                                                return (
                                                    <div key={`empty-${rank}`} className={`text-center ${rankClass}`}>
                                                        <div className={`mx-auto rounded-full ring-4 bg-gray-100 ${avatarClass}`} />
                                                        <div className="mt-3 text-xs font-extrabold text-gray-400">#{rank}</div>
                                                        <div className="text-sm font-bold text-gray-400">Chưa có</div>
                                                    </div>
                                                );
                                            }

                                            const isMe = user?.id === entry.userId;
                                            const meAvatarHighlight = isMe
                                                ? "ring-offset-2 ring-offset-white outline outline-2 outline-primary-400"
                                                : "";

                                            return (
                                                <div key={entry.userId} className={`px-3 py-3 text-center ${rankClass}`}>
                                                    <div className={`mx-auto overflow-hidden rounded-full ring-4 bg-white ${avatarClass} ${meAvatarHighlight}`}>
                                                        <img
                                                            src={entry.avatarUrl || DEFAULT_AVATAR_URL}
                                                            alt={entry.displayName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>

                                                    <div className="mt-3 text-xs font-extrabold text-gray-700">
                                                        #{entry.rankPosition}
                                                    </div>

                                                    <div className="truncate text-sm font-bold text-gray-900">
                                                        {isMe ? "Bạn" : entry.displayName}
                                                    </div>

                                                    <div
                                                        className={`mx-auto mt-2 inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black text-white ${
                                                            rank === 1
                                                                ? "bg-primary-600"
                                                                : rank === 2
                                                                    ? "bg-slate-500"
                                                                    : "bg-orange-500"
                                                        }`}
                                                    >
                                                        {rank === 1 && <Crown className="h-3 w-3" />}
                                                        {entry.totalKn} {scoreLabel}
                                                    </div>

                                                    <div className="mt-1 text-[11px] font-semibold text-gray-500">
                                                        {entry.totalXp} XP
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {meInTopTen && meInTopTen.rankPosition > 10 && (
                                        <div className="mt-10 rounded-2xl bg-primary-600 px-5 py-4 text-white shadow-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold uppercase tracking-wide text-white/80">
                                                        Hạng của bạn #{meInTopTen.rankPosition}
                                                    </div>
                                                    <div className="truncate text-base font-black">
                                                        {meInTopTen.displayName}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xl font-black">
                                                        {meInTopTen.totalKn} {scoreLabel}
                                                    </div>
                                                    <div className="text-[11px] font-semibold text-white/85">
                                                        {meInTopTen.totalXp} XP
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-10">
                                        <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-gray-500">
                                            {period === "WEEK"
                                                ? "Top 10 tuần này"
                                                : period === "MONTH"
                                                    ? "Top 10 tháng này"
                                                    : "Top 10 tổng"}
                                        </div>

                                        <div className="space-y-3">
                                            {remaining.map((entry, idx) => {
                                                const isMe = !!entry && user?.id === entry.userId;
                                                const scoreValue = entry ? entry.totalKn : 0;

                                                return (
                                                    <div
                                                        key={entry?.userId ?? `empty-row-${idx + 4}`}
                                                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                                                            isMe
                                                                ? "border-orange-300 bg-orange-50"
                                                                : "border-gray-100 bg-white"
                                                        }`}
                                                    >
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
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
                                                                        className="h-10 w-10 rounded-full object-cover"
                                                                    />
                                                                    <div className="truncate text-[15px] font-bold text-gray-900">
                                                                        {isMe ? "Bạn" : entry.displayName}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                                                                    <div className="truncate text-sm font-bold text-gray-400">
                                                                        Chưa có người
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="text-right">
                                                            <div className="text-base font-black text-primary-700">
                                                                {scoreValue} {scoreLabel}
                                                            </div>
                                                            <div className="text-[11px] font-semibold text-gray-500">
                                                                {entry?.totalXp ?? 0} XP
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
