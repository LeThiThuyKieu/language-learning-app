import { useState } from "react";
import { ProfileBadge } from "@/services/profileService";

interface BadgesGridProps {
    badges: ProfileBadge[];
}

const FALLBACK_BADGE_ICON = "/profile/scholar.gif";
const DEFAULT_SHOW = 3;

export default function BadgesGrid({ badges }: BadgesGridProps) {
    const [showAll, setShowAll] = useState(false);

    const earnedBadges = badges.filter((b) => b.earned);
    const displayed = showAll ? badges : badges.slice(0, DEFAULT_SHOW);

    return (
        <div className="bg-white rounded-[2rem] border border-primary-100 shadow-sm p-7">
            {/* Header */}
            <div className="flex justify-between items-center mb-7">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-primary-900">
                    Bảng vàng thành tích
                </h2>
                {badges.length > DEFAULT_SHOW && (
                    <button
                        onClick={() => setShowAll((v) => !v)}
                        className="text-[11px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        {showAll ? "Thu gọn" : "Xem tất cả"}
                    </button>
                )}
            </div>

            {/* Chưa có badge nào */}
            {badges.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Bạn chưa có huy hiệu nào.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                        Hoàn thành thêm bài học để mở khóa huy hiệu đầu tiên.
                    </p>
                </div>
            )}

            {/* Grid huy hiệu */}
            {badges.length > 0 && (
                <>
                    <div className="grid grid-cols-3 gap-y-8 gap-x-4">
                        {displayed.map((badge) => (
                            <div
                                key={badge.id}
                                className={`flex flex-col items-center group transition-all duration-300 cursor-pointer ${
                                    badge.earned ? "hover:scale-110" : "opacity-40 grayscale"
                                }`}
                                title={badge.earned ? badge.badgeName : `Cần ${badge.requiredKn} KN để mở khóa`}
                            >
                                {/* Ảnh huy hiệu */}
                                <div className="relative w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 flex items-center justify-center mb-2">
                                    <img
                                        src={badge.iconUrl || FALLBACK_BADGE_ICON}
                                        alt={badge.badgeName}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_BADGE_ICON; }}
                                    />
                                    {/* Lock overlay cho badge chưa đạt */}
                                    {!badge.earned && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg">🔒</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tên */}
                                <span className={`text-[10px] font-black text-center uppercase tracking-tighter leading-tight ${
                                    badge.earned ? "text-[#1f1a17]" : "text-slate-400"
                                }`}>
                                    {badge.badgeName}
                                </span>

                                {/* KN yêu cầu nếu chưa đạt */}
                                {!badge.earned && (
                                    <span className="text-[9px] text-slate-400 mt-0.5">
                                        {badge.requiredKn} KN
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Tóm tắt */}
                    <p className="mt-5 text-[11px] text-slate-400 text-center">
                        Đã đạt <span className="font-bold text-primary-600">{earnedBadges.length}</span> / {badges.length} huy hiệu
                    </p>
                </>
            )}
        </div>
    );
}
