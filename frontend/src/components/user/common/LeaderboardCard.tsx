import { Crown, Medal, Trophy } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_AVATAR_URL } from "@/constants/avatarOptions";
import { useLeaderboard } from "@/hooks/useLeaderboard";

interface LeaderboardCardProps {
    title?: string;
    subtitle?: string;
    className?: string;
}

const formatter = new Intl.NumberFormat("vi-VN");

export default function LeaderboardCard({
    title = "Bảng xếp hạng",
    subtitle = "10 người có tổng KN cao nhất",
    className = "",
}: LeaderboardCardProps) {
    const { user } = useAuthStore();
    const { entries, isLoading, error } = useLeaderboard(10);

    return (
        <div className={`overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-sm ${className}`}>
            <div className="bg-gradient-to-r from-primary-600 via-orange-500 to-amber-400 px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/80">BXH KN</p>
                        <h3 className="text-lg font-black leading-tight">{title}</h3>
                    </div>
                </div>
                <p className="mt-2 text-xs font-medium text-white/85">{subtitle}</p>
            </div>

            <div className="max-h-[470px] overflow-auto p-3">
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
                                <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
                                    <div className="h-2 w-1/3 rounded bg-slate-100 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                        Chưa có dữ liệu bảng xếp hạng.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {entries.map((entry) => {
                            const isCurrentUser = user?.id === entry.userId;
                            const rankStyle =
                                entry.rankPosition === 1
                                    ? "bg-amber-500 text-white"
                                    : entry.rankPosition === 2
                                        ? "bg-slate-500 text-white"
                                        : entry.rankPosition === 3
                                            ? "bg-orange-500 text-white"
                                            : "bg-slate-100 text-slate-700";

                            return (
                                <div
                                    key={entry.userId}
                                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                                        isCurrentUser
                                            ? "border-primary-300 bg-primary-50 shadow-[0_0_0_1px_rgba(249,115,22,0.08)]"
                                            : "border-slate-100 bg-white"
                                    }`}
                                >
                                    <div className={`flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-black ${rankStyle}`}>
                                        {entry.rankPosition}
                                    </div>

                                    <img
                                        src={entry.avatarUrl || DEFAULT_AVATAR_URL}
                                        alt={entry.displayName}
                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-extrabold text-slate-900">
                                                {entry.displayName}
                                            </p>
                                            {isCurrentUser && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-700">
                                                    Bạn
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            {formatter.format(entry.totalKn)} KN · {formatter.format(entry.totalXp)} XP
                                        </p>
                                    </div>

                                    {entry.rankPosition === 1 ? (
                                        <Crown className="h-4 w-4 text-amber-500" />
                                    ) : (
                                        <Medal className="h-4 w-4 text-slate-400" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}