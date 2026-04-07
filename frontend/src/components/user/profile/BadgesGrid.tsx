import { ProfileBadge } from "@/services/profileService";

interface BadgesGridProps {
    badges: ProfileBadge[];
}

const FALLBACK_BADGE_ICON = "/profile/scholar.gif";

export default function BadgesGrid({ badges }: BadgesGridProps) {

    return (
        <div className="bg-white rounded-[2rem] border border-primary-100 shadow-sm p-7">
            {/* UserProfileCard đúng style hình vẽ */}
            <div className="flex justify-between items-center mb-9">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-primary-900">
                    Bảng vàng thành tích
                </h2>
                <button className="text-[11px] font-black uppercase tracking-widest text-primary-700 hover:text-primary-700 transition-colors">
                    Xem tất cả
                </button>
            </div>

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

            {/* Grid Huy hiệu */}
            {badges.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-y-9 gap-x-5">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className="flex flex-col items-center group transition-all duration-300 hover:scale-110 cursor-pointer"
                            title={badge.description}
                        >
                            {/* Vòng tròn chứa Icon */}
                            <div className="relative w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-3 shadow-inner border-4 border-white bg-primary-50">
                                <img
                                    src={badge.iconUrl || FALLBACK_BADGE_ICON}
                                    alt={badge.badgeName}
                                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                                />

                                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            </div>

                            {/* Tên huy hiệu */}
                            <span className="text-[11px] font-black text-center uppercase tracking-tighter leading-tight text-[#1f1a17] group-hover:text-[#1f1a17]">
                            {badge.badgeName}
                        </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}